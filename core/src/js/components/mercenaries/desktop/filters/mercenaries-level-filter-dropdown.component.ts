import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { MercenariesHeroLevelFilterSelectedEvent } from '../../../../services/mainwindow/store/events/mercenaries/mercenaries-hero-level-filter-selected-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreService } from '../../../../services/ui-store/app-ui-store.service';

@Component({
	selector: 'mercenaries-hero-level-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="mercenaries-hero-level-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesHeroLevelFilterDropdownComponent {
	options: readonly FilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly store: AppUiStoreService,
		private readonly cdr: ChangeDetectorRef,
	) {
		this.options = [
			{
				value: '0',
				label: 'All levels',
			} as FilterOption,
			{
				value: '1',
				label: 'Levels 1-4',
			} as FilterOption,
			{
				value: '5',
				label: 'Levels 5-14',
			} as FilterOption,
			{
				value: '15',
				label: 'Levels 15-29',
			} as FilterOption,
			{
				value: '30',
				label: 'Level 30',
			} as FilterOption,
		] as readonly FilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.mercenariesActiveStarterFilter,
				([main, nav]) => nav.navigationMercenaries.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				map(([filter, selectedCategoryId]) => ({
					filter: '' + filter,
					placeholder:
						this.options.find((option) => option.value === '' + filter)?.label ?? this.options[0].label,
					visible:
						selectedCategoryId === 'mercenaries-hero-stats' ||
						selectedCategoryId === 'mercenaries-hero-details',
				})),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	onSelected(option: FilterOption) {
		this.store.send(new MercenariesHeroLevelFilterSelectedEvent(+option.value as any));
	}
}

interface FilterOption extends IOption {
	value: string; // actually MercenariesHeroLevelFilterType;
}
