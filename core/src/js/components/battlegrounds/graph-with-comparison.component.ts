import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	ViewChild,
	ViewRef,
} from '@angular/core';
import { ChartData, ChartDataSets, ChartOptions, ChartTooltipItem, ChartTooltipModel } from 'chart.js';
import { Color, Label } from 'ng2-charts';
import { NumericTurnInfo } from '../../models/battlegrounds/post-match/numeric-turn-info';

declare let amplitude: any;

@Component({
	selector: 'graph-with-comparison',
	styleUrls: [
		`../../../css/global/reset-styles.scss`,
		`../../../css/component/battlegrounds/graph-with-comparison.component.scss`,
	],
	template: `
		<div class="legend">
			<div class="item average" [helpTooltip]="communityTooltip">
				<div class="node"></div>
				{{ communityLabel }}
			</div>
			<div class="item current" [helpTooltip]="yourTooltip">
				<div class="node"></div>
				{{ yourLabel }}
			</div>
		</div>
		<div class="container-1" [style.opacity]="opacity">
			<div style="display: block; position: relative; height: 100%; width: 100%;">
				<canvas
					*ngIf="lineChartData"
					#chart
					baseChart
					[style.width.px]="chartWidth"
					[style.height.px]="chartHeight"
					[datasets]="lineChartData"
					[labels]="lineChartLabels"
					[options]="lineChartOptions"
					[colors]="lineChartColors"
					[legend]="false"
					[chartType]="'line'"
				></canvas>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphWithComparisonComponent {
	@ViewChild('chart', { static: false }) chart: ElementRef;

	chartWidth: number;
	chartHeight: number;
	lineChartData: ChartDataSets[];
	lineChartLabels: Label[];
	lineChartOptions: ChartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		layout: {
			padding: 0,
		},
		scales: {
			xAxes: [
				{
					gridLines: {
						color: '#841063',
					},
					ticks: {
						fontColor: '#D9C3AB',
						fontFamily: 'Open Sans',
						fontStyle: 'normal',
					},
				},
			],
			yAxes: [
				{
					position: 'left',
					gridLines: {
						color: '#40032E',
					},
					ticks: {
						fontColor: '#D9C3AB',
						fontFamily: 'Open Sans',
						fontStyle: 'normal',
						beginAtZero: true,
					},
				},
			],
		},
		tooltips: {
			mode: 'index',
			position: 'nearest',
			intersect: false,
			backgroundColor: '#CE73B4',
			titleFontFamily: 'Open Sans',
			titleFontColor: '#40032E',
			bodyFontFamily: 'Open Sans',
			bodyFontColor: '#40032E',
			xPadding: 5,
			yPadding: 5,
			caretSize: 10,
			caretPadding: 2,
			cornerRadius: 0,
			displayColors: false,
			enabled: false,
			callbacks: {
				beforeBody: (item: ChartTooltipItem[], data: ChartData): string | string[] => {
					// console.log('beforeBody', item, data);
					return data.datasets.map(dataset => dataset?.label || '');
				},
			},
			custom: function(tooltip: ChartTooltipModel) {
				let tooltipEl = document.getElementById('chartjs-tooltip-stats');
				// console.log('tooltip', tooltip);

				if (!tooltipEl) {
					tooltipEl = document.createElement('div');
					tooltipEl.id = 'chartjs-tooltip-stats';
					tooltipEl.innerHTML = `
						<div class="stats-tooltip">					
							<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
								<polygon points="0,0 8,-9 16,0"/>
							</svg>
							<div class="content"></div>
						</div>`;
					this._chart.canvas.parentNode.appendChild(tooltipEl);
				}
				// 230 is the current tooltip width
				const left = Math.max(
					0,
					Math.min(tooltip.caretX - 110, this._chart.canvas.parentNode.getBoundingClientRect().right - 230),
				);
				const caretOffset = tooltip.caretX - 110 - left;
				(tooltipEl.querySelector('.tooltip-arrow') as any).style.marginLeft = caretOffset + 'px';

				// Hide if no tooltip
				if (tooltip.opacity === 0) {
					tooltipEl.style.opacity = '0';
					return;
				}

				// Set Text
				if (tooltip.body) {
					const communityLabel = tooltip.beforeBody[0];
					const yourLabel = tooltip.beforeBody[1];
					const communityDatapoint = tooltip.dataPoints.find(dataset => dataset.datasetIndex === 0);
					const yourDatapoint = tooltip.dataPoints.find(dataset => dataset.datasetIndex === 1);
					const innerHtml = `
						<div class="body">
							<div class="section player">
								<div class="subtitle">${yourLabel}</div>
								<div class="value">Turn ${yourDatapoint?.label}</div>
								<div class="value">${yourDatapoint?.value ? 'Stat ' + parseInt(yourDatapoint.value).toFixed(0) : 'No data'}</div>
							</div>
							<div class="section average">
								<div class="subtitle">${communityLabel}</div>
								<div class="value">Turn ${yourDatapoint?.label}</div>
								<div class="value">${
									communityDatapoint?.value
										? 'Stat ' + parseInt(communityDatapoint.value).toFixed(0)
										: 'No data'
								}</div>							
							</div>
						</div>
					`;

					const tableRoot = tooltipEl.querySelector('.content');
					tableRoot.innerHTML = innerHtml;
				}

				// Display, position, and set styles for font
				tooltipEl.style.opacity = '1';
				tooltipEl.style.left = left + 'px';
				tooltipEl.style.top = tooltip.caretY + 8 - 100 + 'px';
				tooltipEl.style.fontFamily = tooltip._bodyFontFamily;
				tooltipEl.style.fontSize = tooltip.bodyFontSize + 'px';
				tooltipEl.style.fontStyle = tooltip._bodyFontStyle;
				tooltipEl.style.padding = tooltip.yPadding + 'px ' + tooltip.xPadding + 'px';

				// Set caret Position
				tooltipEl.classList.remove('above', 'below', 'no-transform');
				tooltipEl.classList.add('top');
			},
		},
	};
	lineChartColors: Color[];
	opacity = 0;

	@Input() communityLabel: string = 'Community';
	@Input() yourLabel: string = 'You';
	@Input() communityTooltip: string;
	@Input() yourTooltip: string;

	@Input() set communityExtractor(value) {
		if (value === this._communityExtractor) {
			return;
		}
		this._communityExtractor = value;
		this.updateValues();
	}

	@Input() set yourExtractor(value) {
		if (value === this._yourExtractor) {
			return;
		}
		this._yourExtractor = value;
		this.updateValues();
	}

	private _communityExtractor: () => readonly NumericTurnInfo[];
	private _yourExtractor: () => readonly NumericTurnInfo[];
	private _dirty = true;

	constructor(private readonly el: ElementRef, private readonly cdr: ChangeDetectorRef) {}

	private updateValues() {
		if (!this._yourExtractor || !this._communityExtractor) {
			// console.log('not ready');
			return;
		}

		// Turn 0 is before any battle, so it's not really interesting for us
		const community = this.removeZero(this._communityExtractor() || []);
		const your = this.removeZero(this._yourExtractor() || []);

		const maxTurnFromCommunity = this.getMaxTurn(community);
		const maxTurnFromYour = this.getMaxTurn(your);
		const lastTurn = Math.max(maxTurnFromCommunity, maxTurnFromYour);
		// console.log('max turn', maxTurnFromCommunity, maxTurnFromYour, lastTurn, community, your);

		const filledCommunity = this.fillMissingData(community, lastTurn);
		const filledYour = this.fillMissingData(your, lastTurn);

		this.lineChartLabels = [...Array(lastTurn + 1).keys()].filter(turn => turn > 0).map(turn => '' + turn);
		this.lineChartData = [
			{
				data: filledCommunity.map(stat => stat.value),
				label: this.communityLabel,
			},
			{
				data: filledYour.map(stat => stat.value),
				label: this.yourLabel,
			} as any,
		];
		// console.log(
		// 	'last turn is',
		// 	lastTurn,
		// 	this.lineChartLabels,
		// 	this.lineChartData,
		// 	community,
		// 	filledCommunity,
		// 	your,
		// 	filledYour,
		// );
		this.doResize();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	previousWidth: number;

	@HostListener('window:resize')
	onResize() {
		this._dirty = true;
		this.doResize();
	}

	private removeZero(input: readonly NumericTurnInfo[]): readonly NumericTurnInfo[] {
		return input.filter(stat => stat.turn > 0);
	}

	private fillMissingData(input: readonly NumericTurnInfo[], lastTurn: number) {
		const result = [];
		for (let i = 1; i <= lastTurn; i++) {
			result.push(
				input.find(stat => stat.turn === i) || {
					turn: i,
					value: null,
				},
			);
		}
		return result;
	}

	private doResize() {
		if (!this._dirty) {
			return;
		}
		const chartContainer = this.el.nativeElement.querySelector('.container-1');
		const rect = chartContainer?.getBoundingClientRect();
		if (!rect?.width || !rect?.height || !this.chart?.nativeElement?.getContext('2d')) {
			setTimeout(() => {
				this.doResize();
			}, 500);
			return;
		}
		if (rect.width === this.chartWidth && rect.height === this.chartHeight) {
			return;
		}
		this.chartWidth = rect.width;
		this.chartHeight = rect.height;
		const gradient = this.getBackgroundColor();
		// console.log('gradient', gradient);
		this.lineChartColors = [
			{
				backgroundColor: gradient,
				borderColor: '#CE73B4',
				pointBackgroundColor: 'transparent',
				pointBorderColor: 'transparent',
				pointHoverBackgroundColor: 'transparent',
				pointHoverBorderColor: 'transparent',
			},
			{
				backgroundColor: 'transparent',
				borderColor: '#FFB948',
				pointBackgroundColor: 'transparent',
				pointBorderColor: 'transparent',
				pointHoverBackgroundColor: 'transparent',
				pointHoverBorderColor: 'transparent',
			},
		];
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		this.opacity = gradient && this.lineChartData && this.lineChartData.length > 0 ? 1 : 0;
		// console.log('setting opacity', this.opacity, gradient, this.lineChartData);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this.doResize();
		}, 200);
	}

	private getBackgroundColor() {
		if (!this.chart?.nativeElement) {
			return;
		}

		const gradient = this.chart.nativeElement
			?.getContext('2d')
			?.createLinearGradient(0, 0, 0, Math.round(this.chartHeight));
		gradient.addColorStop(0, 'rgba(206, 115, 180, 1)'); // #CE73B4
		gradient.addColorStop(0.4, 'rgba(206, 115, 180, 0.4)');
		gradient.addColorStop(1, 'rgba(206, 115, 180, 0)');
		return gradient;
	}

	private getMaxTurn(input: readonly NumericTurnInfo[]) {
		return input.filter(stat => stat.value).length === 0
			? 0
			: Math.max(...input.filter(stat => stat.value).map(stat => stat.turn));
	}
}