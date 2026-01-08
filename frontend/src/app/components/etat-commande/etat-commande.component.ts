// frontend/src/app/components/etat-commande/etat-commande.component.ts
import { Component, OnInit, signal, computed, ViewChild, ElementRef, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommandeService, CommandeResponse } from '../../services/commande.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

type SearchMode = 'month' | 'period';

interface ArticleDetail {
  articleNom: string;
  quantite: number;
  dateSouhaitee: string;
  typeCommande: string;
}

interface ClientStat {
  clientNom: string;
  quantiteTotale: number;
  nombreCommandes: number;
  quantiteFerme: number;
  quantitePlanifiee: number;
  articlesFerme: ArticleDetail[];
  articlesPlanifiee: ArticleDetail[];
}

interface MonthlyData {
  month: string;
  clients: {
    [clientName: string]: {
      quantite: number;
      ferme: number;
      planifiee: number;
    }
  };
  totalQuantite: number;
}

@Component({
  selector: 'app-etat-commande',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './etat-commande.component.html',
  styleUrl: './etat-commande.component.css'
})
export class EtatCommandeComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyChartCanvas', { static: false }) monthlyChartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private monthlyChart?: Chart;
  private chartInitialized = false;
  private monthlyChartInitialized = false;

  searchMode = signal<SearchMode>('month');
  selectedYear = signal<number>(new Date().getFullYear());
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  dateDebut = signal<string>('');
  dateFin = signal<string>('');

  // ✅ Année pour le graphique mensuel
  monthlyChartYear = signal<number>(new Date().getFullYear());

  commandes = signal<CommandeResponse[]>([]);
  allCommandes = signal<CommandeResponse[]>([]);
  monthlyData = signal<MonthlyData[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  // Options pour les années (10 dernières années + 5 futures)
  years = computed(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 15 }, (_, i) => currentYear - 10 + i);
  });

  months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  // Statistiques par client
  clientStats = computed(() => {
    const stats: Map<string, ClientStat> = new Map();

    this.commandes().forEach(cmd => {
      const existing = stats.get(cmd.clientNom);

      const articleDetail: ArticleDetail = {
        articleNom: cmd.articleNom,
        quantite: cmd.quantite,
        dateSouhaitee: cmd.dateSouhaitee,
        typeCommande: cmd.typeCommande
      };

      if (existing) {
        existing.quantiteTotale += cmd.quantite;
        existing.nombreCommandes++;
        if (cmd.typeCommande === 'FERME') {
          existing.quantiteFerme += cmd.quantite;
          existing.articlesFerme.push(articleDetail);
        } else {
          existing.quantitePlanifiee += cmd.quantite;
          existing.articlesPlanifiee.push(articleDetail);
        }
      } else {
        stats.set(cmd.clientNom, {
          clientNom: cmd.clientNom,
          quantiteTotale: cmd.quantite,
          nombreCommandes: 1,
          quantiteFerme: cmd.typeCommande === 'FERME' ? cmd.quantite : 0,
          quantitePlanifiee: cmd.typeCommande === 'PLANIFIEE' ? cmd.quantite : 0,
          articlesFerme: cmd.typeCommande === 'FERME' ? [articleDetail] : [],
          articlesPlanifiee: cmd.typeCommande === 'PLANIFIEE' ? [articleDetail] : []
        });
      }
    });

    return Array.from(stats.values()).sort((a, b) => b.quantiteTotale - a.quantiteTotale);
  });

  // Statistiques globales
  totalStats = computed(() => {
    const stats = this.clientStats();
    return {
      totalQuantite: stats.reduce((sum, s) => sum + s.quantiteTotale, 0),
      totalCommandes: stats.reduce((sum, s) => sum + s.nombreCommandes, 0),
      totalFerme: stats.reduce((sum, s) => sum + s.quantiteFerme, 0),
      totalPlanifiee: stats.reduce((sum, s) => sum + s.quantitePlanifiee, 0),
      nombreClients: stats.length
    };
  });

  constructor(private commandeService: CommandeService) {
    // Effect pour le graphique par client
    effect(() => {
      const stats = this.clientStats();
      if (stats.length > 0 && this.chartInitialized && !this.isLoading()) {
        setTimeout(() => this.createChart(), 0);
      }
    });

    // ✅ Effect pour le graphique mensuel
    effect(() => {
      const year = this.monthlyChartYear();
      if (this.monthlyChartInitialized && this.allCommandes().length > 0) {
        this.calculateMonthlyData();
      }
    });
  }

  ngOnInit() {
    // Charger toutes les commandes au démarrage
    this.commandeService.getAllCommandes().subscribe({
      next: (commandes) => {
        this.allCommandes.set(commandes);
        this.calculateMonthlyData();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des commandes:', error);
      }
    });

    this.loadData();
  }

  ngAfterViewInit() {
    this.chartInitialized = true;
    this.monthlyChartInitialized = true;

    if (this.commandes().length > 0) {
      setTimeout(() => this.createChart(), 100);
    }

    // ✅ Forcer le calcul initial du graphique mensuel
    setTimeout(() => {
      if (this.allCommandes().length > 0) {
        this.calculateMonthlyData();
      }
    }, 100);
  }

  loadData() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const mode = this.searchMode();

    if (mode === 'month') {
      const year = this.selectedYear();
      const month = this.selectedMonth();
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);

      const dateDebut = this.formatDate(firstDay);
      const dateFin = this.formatDate(lastDay);

      this.loadCommandesByPeriod(dateDebut, dateFin);
    } else {
      const debut = this.dateDebut();
      const fin = this.dateFin();

      if (!debut || !fin) {
        this.errorMessage.set('Veuillez sélectionner une période complète');
        this.isLoading.set(false);
        return;
      }

      if (new Date(debut) > new Date(fin)) {
        this.errorMessage.set('La date de début doit être antérieure à la date de fin');
        this.isLoading.set(false);
        return;
      }

      this.loadCommandesByPeriod(debut, fin);
    }
  }

  private loadCommandesByPeriod(dateDebut: string, dateFin: string) {
    this.commandeService.getAllCommandes().subscribe({
      next: (commandes) => {
        const filtered = commandes.filter(cmd => {
          const cmdDate = cmd.dateSouhaitee;
          return cmdDate >= dateDebut && cmdDate <= dateFin;
        });

        this.commandes.set(filtered);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des commandes:', error);
        this.errorMessage.set('Erreur lors du chargement des données');
        this.isLoading.set(false);
      }
    });
  }

  // ✅ Calculer les données mensuelles
  private calculateMonthlyData() {
    const year = this.monthlyChartYear();
    const monthlyStats: MonthlyData[] = [];

    // Initialiser les 12 mois
    for (let month = 0; month < 12; month++) {
      monthlyStats.push({
        month: this.monthNames[month],
        clients: {},
        totalQuantite: 0
      });
    }

    // Filtrer par année
    const filteredCommandes = this.allCommandes().filter(cmd => {
      const cmdDate = new Date(cmd.dateSouhaitee);
      return cmdDate.getFullYear() === year;
    });

    // Grouper par mois et par client
    filteredCommandes.forEach(cmd => {
      const cmdDate = new Date(cmd.dateSouhaitee);
      const monthIndex = cmdDate.getMonth();
      const clientNom = cmd.clientNom;

      if (!monthlyStats[monthIndex].clients[clientNom]) {
        monthlyStats[monthIndex].clients[clientNom] = {
          quantite: 0,
          ferme: 0,
          planifiee: 0
        };
      }

      monthlyStats[monthIndex].clients[clientNom].quantite += cmd.quantite;
      monthlyStats[monthIndex].totalQuantite += cmd.quantite;

      if (cmd.typeCommande === 'FERME') {
        monthlyStats[monthIndex].clients[clientNom].ferme += cmd.quantite;
      } else {
        monthlyStats[monthIndex].clients[clientNom].planifiee += cmd.quantite;
      }
    });

    this.monthlyData.set(monthlyStats);

    // Créer le graphique
    if (this.monthlyChartInitialized) {
      setTimeout(() => this.createMonthlyChart(monthlyStats), 0);
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateForDisplay(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  resetFilters() {
    this.searchMode.set('month');
    this.selectedYear.set(new Date().getFullYear());
    this.selectedMonth.set(new Date().getMonth() + 1);
    this.dateDebut.set('');
    this.dateFin.set('');
    this.loadData();
  }

  // ✅ Graphique par client (existant)
  private createChart() {
    if (!this.chartCanvas?.nativeElement) {
      return;
    }

    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }

    const stats = this.clientStats();

    if (stats.length === 0) {
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: stats.map(s => s.clientNom),
        datasets: [
          {
            label: 'Quantité Ferme',
            data: stats.map(s => s.quantiteFerme),
            backgroundColor: 'rgba(46, 125, 50, 0.8)',
            borderColor: 'rgba(46, 125, 50, 1)',
            borderWidth: 1
          },
          {
            label: 'Quantité Planifiée',
            data: stats.map(s => s.quantitePlanifiee),
            backgroundColor: 'rgba(255, 152, 0, 0.8)',
            borderColor: 'rgba(255, 152, 0, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Quantités commandées par client',
            font: {
              size: 18,
              weight: 'bold'
            },
            color: '#c2185b'
          },
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 12
              },
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems: any) => {
                const clientNom = tooltipItems[0].label;
                return `Client: ${clientNom}`;
              },
              label: (context: any) => {
                const datasetLabel = context.dataset.label || '';
                const value = context.parsed.y;
                return `${datasetLabel}: ${value}`;
              },
              afterLabel: (context: any) => {
                const clientIndex = context.dataIndex;
                const clientStat = stats[clientIndex];
                const datasetIndex = context.datasetIndex;

                const articles = datasetIndex === 0
                  ? clientStat.articlesFerme
                  : clientStat.articlesPlanifiee;

                if (articles.length === 0) {
                  return '';
                }

                const lines: string[] = ['', '📦 Détails des articles:'];
                const groupedArticles = new Map<string, { quantite: number, dates: string[] }>();

                articles.forEach(art => {
                  const existing = groupedArticles.get(art.articleNom);
                  if (existing) {
                    existing.quantite += art.quantite;
                    if (!existing.dates.includes(art.dateSouhaitee)) {
                      existing.dates.push(art.dateSouhaitee);
                    }
                  } else {
                    groupedArticles.set(art.articleNom, {
                      quantite: art.quantite,
                      dates: [art.dateSouhaitee]
                    });
                  }
                });

                const articlesArray = Array.from(groupedArticles.entries());
                const maxDisplay = 5;
                const maxDatesPerArticle = 3;

                articlesArray.slice(0, maxDisplay).forEach(([articleNom, info]) => {
                  const shortName = articleNom.length > 30
                    ? articleNom.substring(0, 27) + '...'
                    : articleNom;

                  let datesStr = '';
                  if (info.dates.length <= maxDatesPerArticle) {
                    datesStr = info.dates
                      .map(d => this.formatDateForDisplay(d))
                      .join(', ');
                  } else {
                    const displayedDates = info.dates
                      .slice(0, maxDatesPerArticle)
                      .map(d => this.formatDateForDisplay(d))
                      .join(', ');
                    datesStr = `${displayedDates} +${info.dates.length - maxDatesPerArticle}`;
                  }

                  lines.push(`  • ${shortName} (${info.quantite})`);
                  lines.push(`    ${datesStr}`);
                });

                if (articlesArray.length > maxDisplay) {
                  const remaining = articlesArray.length - maxDisplay;
                  lines.push(`  ... et ${remaining} autre${remaining > 1 ? 's' : ''} article${remaining > 1 ? 's' : ''}`);
                }

                return lines;
              },
              footer: (tooltipItems: any) => {
                let total = 0;
                tooltipItems.forEach((item: any) => {
                  if (item.parsed && item.parsed.y !== null) {
                    total += item.parsed.y;
                  }
                });
                return `\nTotal pour ce type: ${total}`;
              }
            },
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 12
            },
            footerFont: {
              size: 12,
              weight: 'bold'
            },
            displayColors: true,
            boxWidth: 10,
            boxHeight: 10
          }
        },
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Clients',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            ticks: {
              font: {
                size: 11
              },
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quantité',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            ticks: {
              font: {
                size: 12
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  // ✅ Graphique mensuel
  private createMonthlyChart(monthlyStats: MonthlyData[]) {
    if (!this.monthlyChartCanvas?.nativeElement) {
      return;
    }

    if (this.monthlyChart) {
      this.monthlyChart.destroy();
      this.monthlyChart = undefined;
    }

    const ctx = this.monthlyChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Obtenir la liste unique de tous les clients
    const allClients = new Set<string>();
    monthlyStats.forEach(month => {
      Object.keys(month.clients).forEach(client => allClients.add(client));
    });

    const clientArray = Array.from(allClients);

    // Générer une couleur pour chaque client
    const colors = this.generateColors(clientArray.length);

    // Créer les datasets
    const datasets = clientArray.map((clientNom, index) => ({
      label: clientNom,
      data: monthlyStats.map(month => month.clients[clientNom]?.quantite || 0),
      backgroundColor: colors[index],
      borderColor: colors[index].replace('0.7', '1'),
      borderWidth: 1
    }));

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: monthlyStats.map(m => m.month),
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Quantités commandées par mois - ${this.monthlyChartYear()}`,
            font: {
              size: 18,
              weight: 'bold'
            },
            color: '#c2185b'
          },
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 11
              },
              padding: 10,
              boxWidth: 12
            }
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems: any) => {
                return `Mois: ${tooltipItems[0].label}`;
              },
              label: (context: any) => {
                const clientNom = context.dataset.label;
                const quantite = context.parsed.y;
                return `${clientNom}: ${quantite}`;
              },
              footer: (tooltipItems: any) => {
                const monthIndex = tooltipItems[0].dataIndex;
                const total = monthlyStats[monthIndex].totalQuantite;
                return `\nTotal du mois: ${total}`;
              }
            },
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 12
            },
            footerFont: {
              size: 12,
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Mois',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            ticks: {
              font: {
                size: 11
              }
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quantité',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            ticks: {
              font: {
                size: 12
              }
            }
          }
        }
      }
    };

    this.monthlyChart = new Chart(ctx, config);
  }

  // ✅ Générer des couleurs distinctes pour chaque client
  private generateColors(count: number): string[] {
    const colors: string[] = [];
    const hueStep = 360 / count;

    for (let i = 0; i < count; i++) {
      const hue = i * hueStep;
      const saturation = 70 + (i % 3) * 10;
      const lightness = 50 + (i % 2) * 10;
      colors.push(`hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`);
    }

    return colors;
  }

  // ✅ Mettre à jour l'année du graphique mensuel
  updateMonthlyChartYear(year: number) {
    this.monthlyChartYear.set(year);
  }

  exportData() {
    const stats = this.clientStats();
    const total = this.totalStats();

    let csv = 'Client,Quantité Totale,Quantité Ferme,Quantité Planifiée,Nombre de Commandes\n';

    stats.forEach(stat => {
      csv += `${stat.clientNom},${stat.quantiteTotale},${stat.quantiteFerme},${stat.quantitePlanifiee},${stat.nombreCommandes}\n`;
    });

    csv += `\nTOTAL,${total.totalQuantite},${total.totalFerme},${total.totalPlanifiee},${total.totalCommandes}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `etat-commandes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
