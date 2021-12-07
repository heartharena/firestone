import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { GenericPreferencesUpdateEvent } from '../../../services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'collection-hero-portrait-owned-filter',
	styleUrls: [
		`../../../../css/global/filters.scss`,
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionHeroPortraitOwnedFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit {
	options: readonly IOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
		this.options = [
			{
				value: 'all',
				label: 'All',
			} as IOption,
			{
				value: 'own',
				label: 'Only the ones I have',
			} as IOption,
			{
				value: 'dontown',
				label: 'Only the ones I do not have',
			} as IOption,
		] as readonly IOption[];
	}

	ngAfterContentInit() {
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.collectionActivePortraitOwnedFilter,
				([main, nav]) => nav.navigationCollection.currentView,
			)
			.pipe(
				filter(([filter, currentView]) => !!filter && !!currentView),
				this.mapData(([filter, currentView]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: currentView === 'hero-portraits',
				})),
			);
	}

	onSelected(option: IOption) {
		this.store.send(
			new GenericPreferencesUpdateEvent((prefs) => ({
				...prefs,
				collectionActivePortraitOwnedFilter: option.value as any,
			})),
		);
	}
}