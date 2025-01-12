import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { FeatureFlags } from '@services/feature-flags';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'duels-ooc-hero-selection-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/background-widget.component.scss'],
	template: `
		<duels-ooc-hero-selection
			class="widget"
			*ngIf="showWidget$ | async"
			[style.width.px]="windowWidth"
			[style.height.px]="windowHeight"
		></duels-ooc-hero-selection>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsOutOfCombatHeroSelectionWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.2;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 0.08 * gameHeight;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected isWidgetVisible = () => this.visible;

	private visible: boolean;

	showWidget$: Observable<boolean>;
	windowWidth: number;
	windowHeight: number;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	ngAfterContentInit(): void {
		this.showWidget$ = combineLatest(
			this.store.listenPrefs$((prefs) => prefs.duelsShowInfoOnHeroSelection),
			this.store.listen$(([main, prefs]) => main?.duels),
		).pipe(
			this.mapData(([[displayFromPrefs], [duels]]) => {
				return FeatureFlags.ENABLE_DUELS_OOC && displayFromPrefs && !!duels.heroOptionsDbfIds?.length;
			}),
		);
		this.showWidget$.pipe(distinctUntilChanged(), takeUntil(this.destroyed$)).subscribe((show) => {
			this.visible = show;
			this.reposition();
		});
	}

	protected async doResize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.height;
		this.windowWidth = gameHeight * 1.15; //201 1311
		this.windowHeight = gameHeight * 0.7;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
