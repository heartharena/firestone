import { Injectable } from '@angular/core';
import { SceneMode, TaskStatus } from '@firestone-hs/reference-data';
import { Subject } from 'rxjs';
import { MemoryMercenariesCollectionInfo, MemoryVisitor } from '../../models/memory/memory-mercenaries-collection-info';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { Events } from '../events.service';
import { LOCAL_STORAGE_MERCENARIES_COLLECTION } from '../local-storage';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { PreferencesService } from '../preferences.service';
import { sleep } from '../utils';

export const SCENE_WITH_RELEVANT_MERC_INFO = [
	SceneMode.GAMEPLAY,
	SceneMode.LETTUCE_BOUNTY_BOARD,
	SceneMode.LETTUCE_BOUNTY_TEAM_SELECT,
	SceneMode.LETTUCE_MAP,
	// SceneMode.LETTUCE_COLLECTION,
	// SceneMode.LETTUCE_COOP,
	// SceneMode.LETTUCE_FRIENDLY,
	// SceneMode.LETTUCE_PACK_OPENING,
	// SceneMode.LETTUCE_PLAY,
	// SceneMode.LETTUCE_VILLAGE,
];

@Injectable()
export class MercenariesMemoryCacheService {
	public memoryCollectionInfo$ = new Subject<MemoryMercenariesCollectionInfo>();

	private previousScene: SceneMode;
	private lastRefreshTimestamp: number;

	constructor(
		private readonly memoryService: MemoryInspectionService,
		private readonly events: Events,
		private readonly prefs: PreferencesService,
	) {
		this.init();
	}

	private init() {
		this.events.on(Events.MEMORY_UPDATE).subscribe(async (event) => {
			const changes: MemoryUpdate = event.data[0];
			const newScene = changes.CurrentScene;
			if (!this.shouldRefreshMemoryInfo(newScene)) {
				return;
			}
			console.debug('[merc-memory] changing scene, refreshing merc info', newScene, SceneMode[newScene]);
			await sleep(2000);
			console.debug('[merc-memory] done waiting');
			const newMercenariesInfo = await this.getMercenariesCollectionInfo();
			this.memoryCollectionInfo$.next(newMercenariesInfo);
		});
	}

	public shouldRefreshMemoryInfo(newScene: SceneMode): boolean {
		if (!SCENE_WITH_RELEVANT_MERC_INFO.includes(newScene)) {
			this.previousScene = null;
			return false;
		}

		if (newScene === SceneMode.GAMEPLAY && !this.previousScene) {
			console.debug('[merc-memory] getting in gameplay from a non-merc scene');
			return false;
		}

		if (this.lastRefreshTimestamp && Date.now() - this.lastRefreshTimestamp < 5000) {
			console.debug('[merc-memory] skipping refresh, too soon');
			return false;
		}

		this.previousScene = newScene;
		this.lastRefreshTimestamp = Date.now();
		return true;
	}

	public async getMercenariesCollectionInfo(): Promise<MemoryMercenariesCollectionInfo> {
		const newMercenariesInfo: MemoryMercenariesCollectionInfo =
			(await this.memoryService.getMercenariesCollectionInfo()) ??
			(await this.loadLocalMercenariesCollectionInfo());
		if (!newMercenariesInfo) {
			return null;
		}

		await this.saveLocalMercenariesCollectionInfo(newMercenariesInfo);
		console.debug('[merc-memory] new merc info', newMercenariesInfo);
		const prefs = await this.prefs.getPreferences();
		const savedVisitorsInfo: readonly MemoryVisitor[] = prefs.mercenariesVisitorsProgress ?? [];
		console.debug('[merc-memory] savedVisitorsInfo', savedVisitorsInfo, newMercenariesInfo.Visitors);
		const newVisitorsInformation: readonly MemoryVisitor[] = this.mergeVisitors(
			newMercenariesInfo.Visitors,
			savedVisitorsInfo,
		);
		console.debug('[merc-memory] newVisitorsInformation', newVisitorsInformation);
		return {
			...newMercenariesInfo,
			Visitors: newVisitorsInformation,
		};
	}

	private async saveLocalMercenariesCollectionInfo(newMercenariesInfo: MemoryMercenariesCollectionInfo) {
		if (!newMercenariesInfo?.Mercenaries?.length) {
			return;
		}
		localStorage.setItem(LOCAL_STORAGE_MERCENARIES_COLLECTION, JSON.stringify(newMercenariesInfo));
		return;
	}

	private async loadLocalMercenariesCollectionInfo(): Promise<MemoryMercenariesCollectionInfo> {
		const result = JSON.parse(localStorage.getItem(LOCAL_STORAGE_MERCENARIES_COLLECTION));
		console.debug('retrieved mercenariesMemoryCollectionInfo from localStoarge', result);
		return result;
	}

	private mergeVisitors(
		fromMemory: readonly MemoryVisitor[],
		savedVisitorsInfo: readonly MemoryVisitor[],
	): readonly MemoryVisitor[] {
		fromMemory = fromMemory ?? [];
		savedVisitorsInfo = savedVisitorsInfo ?? [];
		// Use the memory as the base, as it's the latest info we have
		const result = [...fromMemory];
		for (const visitorInfo of savedVisitorsInfo) {
			if (!result.map((v) => v.TaskId).includes(visitorInfo.TaskId)) {
				// If it's not in memory anymore, this means that the task has been either abandoned or claimed
				if (visitorInfo.Status === TaskStatus.COMPLETE || visitorInfo.Status === TaskStatus.CLAIMED) {
					result.push({
						...visitorInfo,
						Status: TaskStatus.CLAIMED,
					});
				}
				// If it was not in a "COMPLETE" state last time we checked the board, and is not
				// there anymore, this means that it got abandoned, and we remove it
			}
		}
		this.prefs.updateMercenariesVisitorsProgress(result);
		return result;
	}
}
