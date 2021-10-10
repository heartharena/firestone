import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { MercenariesHeroLevelFilterType } from '../../models/mercenaries/mercenaries-hero-level-filter.type';
import { MercenariesModeFilterType } from '../../models/mercenaries/mercenaries-mode-filter.type';
import { MercenariesPveDifficultyFilterType } from '../../models/mercenaries/mercenaries-pve-difficulty-filter.type';
import { MercenariesPvpMmrFilterType } from '../../models/mercenaries/mercenaries-pvp-mmr-filter.type';
import { MercenariesRoleFilterType } from '../../models/mercenaries/mercenaries-role-filter.type';
import { MercenariesStarterFilterType } from '../../models/mercenaries/mercenaries-starter-filter.type';
import { MercenariesComposition, MercenariesHeroStat } from '../mercenaries/mercenaries-state-builder.service';

export const filterMercenariesHeroStats = (
	heroStats: readonly MercenariesHeroStat[],
	modeFilter: MercenariesModeFilterType,
	roleFilter: MercenariesRoleFilterType,
	difficultyFilter: MercenariesPveDifficultyFilterType,
	mmrFilter: MercenariesPvpMmrFilterType,
	starterFilter: MercenariesStarterFilterType,
	heroLevelFilter: MercenariesHeroLevelFilterType,
): readonly MercenariesHeroStat[] => {
	return (
		heroStats
			// .filter((stat) => stat.date === timeFilter)
			.filter((stat) =>
				modeFilter === 'pvp'
					? stat.mmrPercentile === mmrFilter
					: difficultyFilter === 'all' || stat.mmrPercentile === difficultyFilter,
			)
			.filter((stat) => (roleFilter === 'all' ? true : stat.heroRole === roleFilter))
			.filter((stat) => applyStarterFilter(stat, starterFilter))
			.filter((stat) => applyHeroLevelFilter(stat, heroLevelFilter))
	);
};

export const filterMercenariesCompositions = (
	stats: readonly MercenariesComposition[],
	modeFilter: MercenariesModeFilterType,
	difficultyFilter: MercenariesPveDifficultyFilterType,
	mmrFilter: MercenariesPvpMmrFilterType,
): readonly MercenariesComposition[] => {
	return (
		stats
			// .filter((stat) => stat.date === timeFilter)
			.filter((stat) =>
				modeFilter === 'pvp'
					? stat.mmrPercentile === mmrFilter
					: difficultyFilter === 'all' || stat.mmrPercentile === difficultyFilter,
			)
	);
};

export const filterMercenariesRuns = (
	games: readonly GameStat[],
	modeFilter: MercenariesModeFilterType,
	roleFilter: MercenariesRoleFilterType,
	difficultyFilter: MercenariesPveDifficultyFilterType,
	mmrFilter: MercenariesPvpMmrFilterType,
	starterFilter: MercenariesStarterFilterType,
	heroLevelFilter: MercenariesHeroLevelFilterType,
): readonly GameStat[] => {
	return games;
};

const applyStarterFilter = (stat: MercenariesHeroStat, starterFilter: MercenariesStarterFilterType): boolean => {
	switch (starterFilter) {
		case 'all':
			return true;
		case 'starter':
			return stat.starter;
		case 'bench':
			return !stat.starter;
	}
};

const applyHeroLevelFilter = (stat: MercenariesHeroStat, heroLevelFilter: MercenariesHeroLevelFilterType): boolean => {
	switch (heroLevelFilter) {
		case 0:
			return true;
		case 1:
			return stat.heroLevel >= 1 && stat.heroLevel < 5;
		case 5:
			return stat.heroLevel >= 5 && stat.heroLevel < 15;
		case 15:
			return stat.heroLevel >= 15 && stat.heroLevel < 30;
		case 30:
			return stat.heroLevel === 30;
	}
};
