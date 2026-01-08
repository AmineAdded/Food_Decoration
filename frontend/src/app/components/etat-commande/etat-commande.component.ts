// frontend/src/app/components/etat-commande/etat-commande.component.ts
import {
  Component,
  OnInit,
  signal,
  computed,
  ViewChild,
  ElementRef,
  AfterViewInit,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommandeService, CommandeResponse } from '../../services/commande.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables, ChartDataLabels);

type SearchMode = 'month' | 'period';
type ViewMode = 'client' | 'monthly';
type MonthlySearchMode = 'year' | 'period';

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
    };
  };
  totalQuantite: number;
}

@Component({
  selector: 'app-etat-commande',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './etat-commande.component.html',
  styleUrl: './etat-commande.component.css',
})
export class EtatCommandeComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyChartCanvas', { static: false })
  monthlyChartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private monthlyChart?: Chart;
  private chartInitialized = false;
  private monthlyChartInitialized = false;

  viewMode = signal<ViewMode>('client');

  searchMode = signal<SearchMode>('month');
  selectedYear = signal<number>(new Date().getFullYear());
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  dateDebut = signal<string>('');
  dateFin = signal<string>('');
  selectedTypeCommande = signal<'TOUS' | 'FERME' | 'PLANIFIEE'>('TOUS');

  // Nouveaux signaux pour le graphique mensuel
  monthlySearchMode = signal<MonthlySearchMode>('year');
  monthlyChartYear = signal<number>(new Date().getFullYear());
  monthlyChartType = signal<'TOUS' | 'FERME' | 'PLANIFIEE'>('TOUS');
  monthlyDateDebut = signal<string>('');
  monthlyDateFin = signal<string>('');

  commandes = signal<CommandeResponse[]>([]);
  allCommandes = signal<CommandeResponse[]>([]);
  monthlyData = signal<MonthlyData[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

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
    { value: 12, label: 'Décembre' },
  ];

  monthNames = [
    'Jan',
    'Fév',
    'Mar',
    'Avr',
    'Mai',
    'Juin',
    'Juil',
    'Août',
    'Sep',
    'Oct',
    'Nov',
    'Déc',
  ];

  clientStats = computed(() => {
    const stats: Map<string, ClientStat> = new Map();

    this.commandes().forEach((cmd) => {
      const existing = stats.get(cmd.clientNom);

      const articleDetail: ArticleDetail = {
        articleNom: cmd.articleNom,
        quantite: cmd.quantite,
        dateSouhaitee: cmd.dateSouhaitee,
        typeCommande: cmd.typeCommande,
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
          articlesPlanifiee: cmd.typeCommande === 'PLANIFIEE' ? [articleDetail] : [],
        });
      }
    });

    return Array.from(stats.values()).sort((a, b) => b.quantiteTotale - a.quantiteTotale);
  });

  totalStats = computed(() => {
    const stats = this.clientStats();
    return {
      totalQuantite: stats.reduce((sum, s) => sum + s.quantiteTotale, 0),
      totalCommandes: stats.reduce((sum, s) => sum + s.nombreCommandes, 0),
      totalFerme: stats.reduce((sum, s) => sum + s.quantiteFerme, 0),
      totalPlanifiee: stats.reduce((sum, s) => sum + s.quantitePlanifiee, 0),
      nombreClients: stats.length,
    };
  });

  constructor(private commandeService: CommandeService) {
    effect(() => {
      const stats = this.clientStats();
      if (
        stats.length > 0 &&
        this.chartInitialized &&
        !this.isLoading() &&
        this.viewMode() === 'client'
      ) {
        setTimeout(() => this.createChart(), 0);
      }
    });

    effect(() => {
      const searchMode = this.monthlySearchMode();
      const year = this.monthlyChartYear();
      const type = this.monthlyChartType();
      const dateDebut = this.monthlyDateDebut();
      const dateFin = this.monthlyDateFin();

      if (
        this.monthlyChartInitialized &&
        this.allCommandes().length > 0 &&
        this.viewMode() === 'monthly'
      ) {
        this.calculateMonthlyData();
      }
    });
  }

  ngOnInit() {
    this.commandeService.getAllCommandes().subscribe({
      next: (commandes) => {
        this.allCommandes.set(commandes);
        if (this.viewMode() === 'monthly') {
          this.calculateMonthlyData();
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des commandes:', error);
      },
    });

    this.loadData();
  }

  ngAfterViewInit() {
    this.chartInitialized = true;
    this.monthlyChartInitialized = true;

    if (this.commandes().length > 0 && this.viewMode() === 'client') {
      setTimeout(() => this.createChart(), 100);
    }

    if (this.viewMode() === 'monthly') {
      setTimeout(() => {
        if (this.allCommandes().length > 0) {
          this.calculateMonthlyData();
        }
      }, 100);
    }
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
        const filtered = commandes.filter((cmd) => {
          const cmdDate = cmd.dateSouhaitee;
          const dateInRange = cmdDate >= dateDebut && cmdDate <= dateFin;

          const typeCommande = this.selectedTypeCommande();
          if (typeCommande === 'TOUS') {
            return dateInRange;
          }
          return dateInRange && cmd.typeCommande === typeCommande;
        });

        this.commandes.set(filtered);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des commandes:', error);
        this.errorMessage.set('Erreur lors du chargement des données');
        this.isLoading.set(false);
      },
    });
  }

  private calculateMonthlyData() {
    const searchMode = this.monthlySearchMode();
    const typeFilter = this.monthlyChartType();

    let startDate: Date;
    let endDate: Date;
    let monthlyStats: MonthlyData[] = [];

    if (searchMode === 'year') {
      const year = this.monthlyChartYear();
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);

      // Créer les stats pour les 12 mois
      for (let month = 0; month < 12; month++) {
        monthlyStats.push({
          month: this.monthNames[month],
          clients: {},
          totalQuantite: 0,
        });
      }
    } else {
      const debut = this.monthlyDateDebut();
      const fin = this.monthlyDateFin();

      if (!debut || !fin) {
        return;
      }

      startDate = new Date(debut);
      endDate = new Date(fin);

      // Créer les stats pour chaque mois dans la période
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const monthName = `${this.monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        monthlyStats.push({
          month: monthName,
          clients: {},
          totalQuantite: 0,
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    const filteredCommandes = this.allCommandes().filter((cmd) => {
      const cmdDate = new Date(cmd.dateSouhaitee);
      const dateInRange = cmdDate >= startDate && cmdDate <= endDate;

      if (typeFilter === 'TOUS') {
        return dateInRange;
      }
      return dateInRange && cmd.typeCommande === typeFilter;
    });

    filteredCommandes.forEach((cmd) => {
      const cmdDate = new Date(cmd.dateSouhaitee);
      const clientNom = cmd.clientNom;

      let monthIndex: number;

      if (searchMode === 'year') {
        monthIndex = cmdDate.getMonth();
      } else {
        // Calculer l'index du mois dans la période
        const monthsDiff =
          (cmdDate.getFullYear() - startDate.getFullYear()) * 12 +
          (cmdDate.getMonth() - startDate.getMonth());
        monthIndex = monthsDiff;
      }

      if (monthIndex >= 0 && monthIndex < monthlyStats.length) {
        if (!monthlyStats[monthIndex].clients[clientNom]) {
          monthlyStats[monthIndex].clients[clientNom] = {
            quantite: 0,
            ferme: 0,
            planifiee: 0,
          };
        }

        monthlyStats[monthIndex].clients[clientNom].quantite += cmd.quantite;
        monthlyStats[monthIndex].totalQuantite += cmd.quantite;

        if (cmd.typeCommande === 'FERME') {
          monthlyStats[monthIndex].clients[clientNom].ferme += cmd.quantite;
        } else {
          monthlyStats[monthIndex].clients[clientNom].planifiee += cmd.quantite;
        }
      }
    });

    this.monthlyData.set(monthlyStats);

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
    this.selectedTypeCommande.set('TOUS');
    this.loadData();
  }

  resetMonthlyFilters() {
    this.monthlySearchMode.set('year');
    this.monthlyChartYear.set(new Date().getFullYear());
    this.monthlyChartType.set('TOUS');
    this.monthlyDateDebut.set('');
    this.monthlyDateFin.set('');
    this.calculateMonthlyData();
  }

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

    const allArticles = new Set<string>();
    const clientArticleData = new Map<string, Map<string, { ferme: number; planifiee: number }>>();

    stats.forEach((clientStat) => {
      const articleQuantities = new Map<string, { ferme: number; planifiee: number }>();

      clientStat.articlesFerme.forEach((art) => {
        allArticles.add(art.articleNom);
        const current = articleQuantities.get(art.articleNom) || { ferme: 0, planifiee: 0 };
        current.ferme += art.quantite;
        articleQuantities.set(art.articleNom, current);
      });

      clientStat.articlesPlanifiee.forEach((art) => {
        allArticles.add(art.articleNom);
        const current = articleQuantities.get(art.articleNom) || { ferme: 0, planifiee: 0 };
        current.planifiee += art.quantite;
        articleQuantities.set(art.articleNom, current);
      });

      clientArticleData.set(clientStat.clientNom, articleQuantities);
    });

    const uniqueArticles = Array.from(allArticles);
    const articleColors = this.generateColors(uniqueArticles.length);
    const articleColorMap = new Map<string, string>();
    uniqueArticles.forEach((article, index) => {
      articleColorMap.set(article, articleColors[index]);
    });

    const datasets = uniqueArticles.map((articleNom) => {
      const data = stats.map((clientStat) => {
        const clientArticles = clientArticleData.get(clientStat.clientNom);
        const articleData = clientArticles?.get(articleNom);
        return (articleData?.ferme || 0) + (articleData?.planifiee || 0);
      });

      return {
        label: articleNom,
        data: data,
        backgroundColor: articleColorMap.get(articleNom) || 'rgba(150, 150, 150, 0.7)',
        borderColor: (articleColorMap.get(articleNom) || 'rgba(150, 150, 150, 0.7)').replace(
          '0.7',
          '1'
        ),
        borderWidth: 1,
        barThickness: 40,
        maxBarThickness: 60,
      };
    });

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: stats.map((s) => s.clientNom),
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Articles commandés par client',
            font: {
              size: 18,
              weight: 'bold',
            },
            color: '#c2185b',
          },
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 11,
              },
              padding: 10,
              boxWidth: 12,
            },
          },
          datalabels: {
            display: function (context: any) {
              // Afficher la valeur si elle est supérieure à 0
              return context.dataset.data[context.dataIndex] > 0;
            },
            anchor: 'center',
            align: 'center',
            formatter: function (value: any, context: any) {
              // Afficher la valeur de ce segment
              return value > 0 ? value.toString() : '';
            },
            font: {
              size: 11,
              weight: 'bold',
            },
            color: '#ffffff',
            textStrokeColor: '#000000',
            textStrokeWidth: 2,
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems: any) => {
                return `Client: ${tooltipItems[0].label}`;
              },
              label: (context: any) => {
                const articleNom = context.dataset.label;
                const clientNom = context.label;
                const clientArticles = clientArticleData.get(clientNom);
                const articleData = clientArticles?.get(articleNom);

                if (!articleData || (articleData.ferme === 0 && articleData.planifiee === 0)) {
                  return '';
                }

                const lines = [`${articleNom}:`];

                if (articleData.ferme > 0) {
                  lines.push(`  • Ferme: ${articleData.ferme}`);
                }

                if (articleData.planifiee > 0) {
                  lines.push(`  • Planifiée: ${articleData.planifiee}`);
                }

                const total = articleData.ferme + articleData.planifiee;
                lines.push(`  • Total: ${total}`);

                return lines;
              },
              footer: (tooltipItems: any) => {
                const clientNom = tooltipItems[0].label;
                const clientStat = stats.find((s) => s.clientNom === clientNom);

                if (!clientStat) return '';

                return [
                  '',
                  `Quantité Ferme totale: ${clientStat.quantiteFerme}`,
                  `Quantité Planifiée totale: ${clientStat.quantitePlanifiee}`,
                  `Quantité totale: ${clientStat.quantiteTotale}`,
                ];
              },
            },
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 12,
            },
            footerFont: {
              size: 12,
              weight: 'bold',
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Clients',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
            ticks: {
              font: {
                size: 11,
              },
              maxRotation: 45,
              minRotation: 45,
            },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quantité',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
            ticks: {
              font: {
                size: 12,
              },
            },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }

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

    const allClients = new Set<string>();
    monthlyStats.forEach((month) => {
      Object.keys(month.clients).forEach((client) => allClients.add(client));
    });

    const clientArray = Array.from(allClients);
    const colors = this.generateColors(clientArray.length);

    const datasets = clientArray.map((clientNom, index) => ({
      label: clientNom,
      data: monthlyStats.map((month) => month.clients[clientNom]?.quantite || 0),
      backgroundColor: colors[index],
      borderColor: colors[index].replace('0.7', '1'),
      borderWidth: 1,
    }));

    const typeFilter = this.monthlyChartType();
    const searchMode = this.monthlySearchMode();

    let titleSuffix = '';
    if (typeFilter === 'FERME') {
      titleSuffix = ' (Ferme)';
    } else if (typeFilter === 'PLANIFIEE') {
      titleSuffix = ' (Planifiée)';
    }

    let titlePeriod = '';
    if (searchMode === 'year') {
      titlePeriod = `${this.monthlyChartYear()}`;
    } else {
      const debut = this.monthlyDateDebut();
      const fin = this.monthlyDateFin();
      if (debut && fin) {
        titlePeriod = `${this.formatDateForDisplay(debut)} - ${this.formatDateForDisplay(fin)}`;
      }
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: monthlyStats.map((m) => m.month),
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Quantités commandées par mois - ${titlePeriod}${titleSuffix}`,
            font: {
              size: 18,
              weight: 'bold',
            },
            color: '#c2185b',
          },
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 11,
              },
              padding: 10,
              boxWidth: 12,
            },
          },
          datalabels: {
            display: function (context: any) {
              // Afficher la valeur si elle est supérieure à 0
              return context.dataset.data[context.dataIndex] > 0;
            },
            anchor: 'center',
            align: 'center',
            formatter: function (value: any, context: any) {
              // Afficher la valeur de ce segment
              return value > 0 ? value.toString() : '';
            },
            font: {
              size: 11,
              weight: 'bold',
            },
            color: '#ffffff',
            textStrokeColor: '#000000',
            textStrokeWidth: 2,
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems: any) => {
                return `Mois: ${tooltipItems[0].label}`;
              },
              label: (context: any) => {
                const clientNom = context.dataset.label;
                const monthIndex = context.dataIndex;
                const clientData = monthlyStats[monthIndex].clients[clientNom];

                if (!clientData) return '';

                const lines = [`${clientNom}:`];

                if (typeFilter === 'TOUS') {
                  if (clientData.ferme > 0) {
                    lines.push(`  • Ferme: ${clientData.ferme}`);
                  }

                  if (clientData.planifiee > 0) {
                    lines.push(`  • Planifiée: ${clientData.planifiee}`);
                  }

                  lines.push(`  • Total: ${clientData.quantite}`);
                } else if (typeFilter === 'FERME') {
                  lines.push(`  • Ferme: ${clientData.quantite}`);
                } else if (typeFilter === 'PLANIFIEE') {
                  lines.push(`  • Planifiée: ${clientData.quantite}`);
                }

                return lines;
              },
              footer: (tooltipItems: any) => {
                const monthIndex = tooltipItems[0].dataIndex;
                const total = monthlyStats[monthIndex].totalQuantite;
                return `\nTotal du mois: ${total}`;
              },
            },
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 12,
            },
            footerFont: {
              size: 12,
              weight: 'bold',
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Mois',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
            ticks: {
              font: {
                size: 11,
              },
            },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quantité',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
            ticks: {
              font: {
                size: 12,
              },
            },
          },
        },
      },
    };

    this.monthlyChart = new Chart(ctx, config);
  }

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

  updateMonthlyChartYear(year: number) {
    this.monthlyChartYear.set(year);
  }

  updateMonthlyChartType(type: 'TOUS' | 'FERME' | 'PLANIFIEE') {
    this.monthlyChartType.set(type);
  }

  exportData() {
    const mode = this.searchMode();

    if (mode === 'month') {
      const year = this.selectedYear();
      const month = this.selectedMonth();

      this.commandeService.exportEtatCommandes('month', year, month).subscribe({
        next: (blob) => {
          this.downloadFile(blob, `etat_commandes_${this.getMonthName(month)}_${year}.xlsx`);
        },
        error: (error) => {
          console.error("Erreur lors de l'export:", error);
          this.errorMessage.set("Erreur lors de l'export Excel");
        },
      });
    } else {
      const dateDebut = this.dateDebut();
      const dateFin = this.dateFin();

      if (!dateDebut || !dateFin) {
        this.errorMessage.set('Veuillez sélectionner une période complète');
        return;
      }

      this.commandeService
        .exportEtatCommandes('period', undefined, undefined, dateDebut, dateFin)
        .subscribe({
          next: (blob) => {
            const formattedDebut = this.formatDateForFilename(dateDebut);
            const formattedFin = this.formatDateForFilename(dateFin);
            this.downloadFile(blob, `etat_commandes_${formattedDebut}_${formattedFin}.xlsx`);
          },
          error: (error) => {
            console.error("Erreur lors de l'export:", error);
            this.errorMessage.set("Erreur lors de l'export Excel");
          },
        });
    }
  }

  private downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private getMonthName(month: number): string {
    const monthNames = [
      'janvier',
      'fevrier',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'aout',
      'septembre',
      'octobre',
      'novembre',
      'decembre',
    ];
    return monthNames[month - 1];
  }

  private formatDateForFilename(dateStr: string): string {
    return dateStr.replace(/-/g, '');
  }
}
