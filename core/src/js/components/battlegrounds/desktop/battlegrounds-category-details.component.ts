import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { AppUiStoreService, cdLog } from '../../../services/app-ui-store.service';

@Component({
	selector: 'battlegrounds-category-details',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/battlegrounds/desktop/battlegrounds-category-details.component.scss`,
	],
	template: `
		<div
			class="battlegrounds-category-details"
			scrollable
			*ngIf="selectedCategoryId$ | async as selectedCategoryId"
		>
			<battlegrounds-personal-stats-heroes *ngxCacheIf="selectedCategoryId === 'bgs-category-personal-heroes'">
			</battlegrounds-personal-stats-heroes>
			<battlegrounds-personal-stats-rating *ngxCacheIf="selectedCategoryId === 'bgs-category-personal-rating'">
			</battlegrounds-personal-stats-rating>
			<battlegrounds-personal-stats-stats *ngxCacheIf="selectedCategoryId === 'bgs-category-personal-stats'">
			</battlegrounds-personal-stats-stats>
			<battlegrounds-perfect-games *ngxCacheIf="selectedCategoryId === 'bgs-category-perfect-games'">
			</battlegrounds-perfect-games>
			<battlegrounds-personal-stats-hero-details
				*ngxCacheIf="
					selectedCategoryId && selectedCategoryId.indexOf('bgs-category-personal-hero-details') !== -1
				"
			>
			</battlegrounds-personal-stats-hero-details>
			<battlegrounds-simulator *ngxCacheIf="selectedCategoryId === 'bgs-category-simulator'">
			</battlegrounds-simulator>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCategoryDetailsComponent {
	selectedCategoryId$: Observable<string>;

	constructor(private readonly store: AppUiStoreService) {
		this.selectedCategoryId$ = this.store
			.listen$(([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId)
			.pipe(
				filter(([selectedCategoryId]) => !!selectedCategoryId),
				map(([selectedCategoryId]) => selectedCategoryId),
				distinctUntilChanged(),
				tap((selectedCategoryId) =>
					cdLog('emitting selectedCategoryId in ', this.constructor.name, selectedCategoryId),
				),
			);
	}
}
