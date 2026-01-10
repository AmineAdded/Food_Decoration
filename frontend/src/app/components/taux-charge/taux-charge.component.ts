// frontend/src/app/components/taux-charge/taux-charge.component.ts
import {
  Component,
  OnInit,
  signal,
  computed,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { CommandeService, CommandeResponse } from '../../services/commande.service';
import { ProcessService, ProcessResponse } from '../../services/process.service';
import { ArticleService, ArticleResponse } from '../../services/article.service';
import { TauxChargeExportService } from '../../services/taux-charge-export.service';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables, ChartDataLabels);

interface ProcessChargeData {
  processNom: string;
  tauxCharge: number;
  tempsNecessaire: number;
}

@Component({
  selector: 'app-taux-charge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './taux-charge.component.html',
  styleUrl: './taux-charge.component.css',
})
export class TauxChargeComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  chart: Chart | null = null;

  // Filtres
  searchMode = signal<'month' | 'period'>('month');
  selectedYear = signal<number>(new Date().getFullYear());
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  dateDebut = signal<string>('');
  dateFin = signal<string>('');
  heuresDisponibles = signal<number>(160);

  // Données
  allProcess = signal<ProcessResponse[]>([]);
  allArticles = signal<ArticleResponse[]>([]);
  commandes = signal<CommandeResponse[]>([]);
  chargeData = signal<ProcessChargeData[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');

  // Années disponibles
  availableYears = computed(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  });

  // Mois
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

  constructor(
    private commandeService: CommandeService,
    private processService: ProcessService,
    private articleService: ArticleService,
    private exportService: TauxChargeExportService
  ) {}

  ngOnInit() {
    this.loadInitialData();
  }

  ngAfterViewInit() {
    this.initChart();
  }

  loadInitialData() {
    this.isLoading.set(true);

    this.processService.getAllProcess().subscribe({
      next: (process) => {
        this.allProcess.set(process);

        this.articleService.getAllArticles().subscribe({
          next: (articles) => {
            this.allArticles.set(articles);
            this.loadCommandes();
          },
          error: (err) => {
            console.error('Erreur chargement articles:', err);
            this.errorMessage.set('Erreur lors du chargement des articles');
            this.isLoading.set(false);
          },
        });
      },
      error: (err) => {
        console.error('Erreur chargement process:', err);
        this.errorMessage.set('Erreur lors du chargement des process');
        this.isLoading.set(false);
      },
    });
  }

  loadCommandes() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.commandeService.getAllCommandes().subscribe({
      next: (allCommandes) => {
        const filtered = this.filterCommandesByPeriod(allCommandes);
        this.commandes.set(filtered);
        this.calculateChargeData();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement commandes:', err);
        this.errorMessage.set('Erreur lors du chargement des commandes');
        this.isLoading.set(false);
      },
    });
  }

  filterCommandesByPeriod(commandes: CommandeResponse[]): CommandeResponse[] {
    const mode = this.searchMode();

    if (mode === 'month') {
      const year = this.selectedYear();
      const month = this.selectedMonth();

      return commandes.filter((cmd) => {
        const date = new Date(cmd.dateSouhaitee);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      });
    } else {
      const debut = this.dateDebut();
      const fin = this.dateFin();

      if (!debut || !fin) return [];

      return commandes.filter((cmd) => {
        const date = cmd.dateSouhaitee;
        return date >= debut && date <= fin;
      });
    }
  }

  calculateChargeData() {
    const process = this.allProcess();
    const articles = this.allArticles();
    const commandes = this.commandes();
    const heuresDisponibles = this.heuresDisponibles();

    if (heuresDisponibles <= 0) {
      this.errorMessage.set('Les heures disponibles doivent être supérieures à 0');
      return;
    }

    const chargeDataMap = new Map<string, ProcessChargeData>();

    process.forEach((proc) => {
      chargeDataMap.set(proc.nom, {
        processNom: proc.nom,
        tauxCharge: 0,
        tempsNecessaire: 0,
      });
    });

    commandes.forEach((cmd) => {
      const article = articles.find((a) => a.ref === cmd.articleRef);
      if (!article) return;

      article.processes.forEach((processDetail) => {
        const processNom = processDetail.name;
        const tempsParPFSecondes = processDetail.tempsParPF || 0;
        const quantite = cmd.quantite;

        const tempsParPFHeures = tempsParPFSecondes / 3600;
        const tempsTotal = quantite * tempsParPFHeures;

        const existing = chargeDataMap.get(processNom);
        if (existing) {
          existing.tempsNecessaire += tempsTotal;
        }
      });
    });

    chargeDataMap.forEach((data) => {
      data.tauxCharge = (data.tempsNecessaire / heuresDisponibles) * 100;
    });

    const chargeArray = Array.from(chargeDataMap.values()).sort((a, b) =>
      a.processNom.localeCompare(b.processNom, 'fr')
    );

    this.chargeData.set(chargeArray);
    this.updateChart();
  }

  initChart() {
    if (!this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 2,
            borderRadius: 8,
            barThickness: 50,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            anchor: 'end',
            align: 'top',
            formatter: (value) => value.toFixed(0) + '%',
            font: { size: 12, weight: 'bold' },
            color: '#333',
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              padding: 40,
              boxWidth: 30,
              boxHeight: 18,
              generateLabels: () => [
                {
                  text: '< 50% : Sous-charge',
                  fillStyle: 'rgba(33,150,243,0.7)',
                  strokeStyle: 'rgba(33,150,243,1)',
                  lineWidth: 2,
                },
                {
                  text: '50-80% : Optimal',
                  fillStyle: 'rgba(76,175,80,0.7)',
                  strokeStyle: 'rgba(76,175,80,1)',
                  lineWidth: 2,
                },
                {
                  text: '80-100% : Proche saturation',
                  fillStyle: 'rgba(255,152,0,0.7)',
                  strokeStyle: 'rgba(255,152,0,1)',
                  lineWidth: 2,
                },
                {
                  text: '> 100% : Surcharge',
                  fillStyle: 'rgba(244,67,54,0.7)',
                  strokeStyle: 'rgba(244,67,54,1)',
                  lineWidth: 2,
                },
              ],
              font: { size: 14, weight: 'bold' },
              color: '#333',
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                const index = context.dataIndex;
                const data = this.chargeData()[index];
                return [
                  `Taux: ${(value ?? 0).toFixed(2)}%`,
                  `Temps nécessaire: ${data.tempsNecessaire.toFixed(2)}h`,
                  `Heures disponibles: ${this.heuresDisponibles()}h`,
                ];
              },
            },
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            padding: 12,
            cornerRadius: 8,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Taux de charge (%)',
              font: { size: 14, weight: 'bold' },
              color: '#666',
            },
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              callback: (value) => Number(value).toFixed(2) + '%',
              font: { size: 12 },
              color: '#666',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Process',
              font: { size: 14, weight: 'bold' },
              color: '#666',
            },
            grid: { display: false },
            ticks: {
              font: { size: 11, weight: 'bold' },
              autoSkip: true,
              maxRotation: 40,
              minRotation: 40,
              color: '#333',
            },
          },
        },
      },
    });
  }

  updateChart() {
    if (!this.chart) return;

    const data = this.chargeData();
    const labels = data.map((d) => d.processNom);
    const values = data.map((d) => d.tauxCharge);

    const colors = values.map((value) => {
      if (value > 100) return 'rgba(244, 67, 54, 0.7)';
      else if (value > 80) return 'rgba(255, 152, 0, 0.7)';
      else if (value > 50) return 'rgba(76, 175, 80, 0.7)';
      else return 'rgba(33, 150, 243, 0.7)';
    });

    const borderColors = colors.map((color) => color.replace('0.7', '1'));

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = values;
    this.chart.data.datasets[0].backgroundColor = colors;
    this.chart.data.datasets[0].borderColor = borderColors;

    this.chart.update();
  }

  onSearchModeChange() {
    this.errorMessage.set('');
    if (this.searchMode() === 'month') {
      this.dateDebut.set('');
      this.dateFin.set('');
    }
  }

  onFilterChange() {
    this.loadCommandes();
  }

  resetFilters() {
    this.searchMode.set('month');
    this.selectedYear.set(new Date().getFullYear());
    this.selectedMonth.set(new Date().getMonth() + 1);
    this.dateDebut.set('');
    this.dateFin.set('');
    this.heuresDisponibles.set(160);
    this.errorMessage.set('');
    this.loadCommandes();
  }

  getPeriodLabel(): string {
    const mode = this.searchMode();

    if (mode === 'month') {
      const monthObj = this.months.find((m) => m.value === this.selectedMonth());
      return `${monthObj?.label} ${this.selectedYear()}`;
    } else {
      if (this.dateDebut() && this.dateFin()) {
        const debut = new Date(this.dateDebut());
        const fin = new Date(this.dateFin());
        return `Du ${debut.toLocaleDateString('fr-FR')} au ${fin.toLocaleDateString('fr-FR')}`;
      }
      return 'Période non définie';
    }
  }

  exportToExcel() {
    const data = this.chargeData();

    if (data.length === 0) {
      console.warn('⚠️ Aucune donnée à exporter');
      return;
    }

    const periode = this.getPeriodLabel();
    const heuresDisponibles = this.heuresDisponibles();

    const exportData = data.map((item) => ({
      processNom: item.processNom,
      tempsNecessaire: item.tempsNecessaire,
      heuresDisponibles: heuresDisponibles,
      tauxCharge: item.tauxCharge,
      statut: this.getStatutLabel(item.tauxCharge),
    }));

    this.exportService.exportToExcel(exportData, periode, heuresDisponibles);
  }

  private getStatutLabel(tauxCharge: number): string {
    if (tauxCharge < 50) return 'Sous-charge';
    else if (tauxCharge >= 50 && tauxCharge <= 80) return 'Optimal';
    else if (tauxCharge > 80 && tauxCharge <= 100) return 'Proche saturation';
    else return '⚠ Surcharge';
  }
}
