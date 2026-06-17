import { describe, it, expect } from 'vitest'
import buildSchedule from './buildSchedule.js'

const baseGroup = { id: 'g1', name: 'Aleph', tier_id: 't1', availability: 'all' }
const baseDay = { id: 'd1', label: 'Monday', day_of_week: 1, sort_order: 0 }
const baseBlock = { id: 'b1', name: 'Morning', start_time: '09:00', end_time: '10:15', sort_order: 0, part_of_day: 'morning' }

function minimal(overrides = {}) {
  return {
    groups: [baseGroup],
    tiers: [{ id: 't1', name: 'Junior' }],
    days: [baseDay],
    timeBlocks: [baseBlock],
    activities: [],
    anchors: [],
    campId: 'test',
    ...overrides,
  }
}

describe('UNFILLABLE flag', () => {
  it('sets UNFILLABLE_reason when no activities are eligible', () => {
    const { slots } = buildSchedule(minimal({ activities: [] }))
    const unfillable = slots.find(s => s.flags?.UNFILLABLE)
    expect(unfillable).toBeTruthy()
    expect(unfillable.flags.UNFILLABLE_reason).toBe('No eligible activity could be placed in this slot')
  })
})

describe('WEATHER_RISK flag', () => {
  it('sets WEATHER_RISK_reason on outdoor activity slots', () => {
    const act = { id: 'a1', name: 'Swimming', priority: 'low', max_per_week: 5, min_per_week: 0, is_outdoor: true, location: null, max_groups_per_slot: 1, same_tier_only: false, eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: null, prefer_before_day_min: null }
    const { slots } = buildSchedule(minimal({ activities: [act] }))
    const weatherSlot = slots.find(s => s.flags?.WEATHER_RISK)
    expect(weatherSlot).toBeTruthy()
    expect(weatherSlot.flags.WEATHER_RISK_reason).toBe('Outdoor activity scheduled in this slot')
  })
})

describe('UNDERSERVED flag', () => {
  it('sets UNDERSERVED_reason with counts when min_per_week cannot be met', () => {
    // 1 block available, min_per_week = 3 → underserved
    const act = { id: 'a1', name: 'Archery', priority: 'low', max_per_week: 5, min_per_week: 3, is_outdoor: false, location: null, max_groups_per_slot: 1, same_tier_only: false, eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: null, prefer_before_day_min: null }
    const { slots } = buildSchedule(minimal({ activities: [act] }))
    const underservedSlot = slots.find(s => s.flags?.UNDERSERVED)
    expect(underservedSlot).toBeTruthy()
    expect(underservedSlot.flags.UNDERSERVED_reason).toMatch(/Goal: 3×\/wk/)
    expect(underservedSlot.flags.UNDERSERVED_reason).toMatch(/Aleph/)
    expect(underservedSlot.flags.UNDERSERVED_reason).toMatch(/Archery/)
  })
})

describe('DISTRIBUTION flag', () => {
  it('sets DISTRIBUTION_reason when early-week goal not met', () => {
    // 2 days, prefer 2× before day_of_week=2 (Tuesday), but activity placed both Mon+Tue
    const day2 = { id: 'd2', label: 'Tuesday', day_of_week: 2, sort_order: 1 }
    const act = { id: 'a1', name: 'Arts', priority: 'low', max_per_week: 5, min_per_week: 0, is_outdoor: false, location: null, max_groups_per_slot: 1, same_tier_only: false, eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: 2, prefer_before_day_min: 2 }
    const { slots } = buildSchedule(minimal({ days: [baseDay, day2], activities: [act] }))
    const distSlot = slots.find(s => s.flags?.DISTRIBUTION)
    expect(distSlot).toBeTruthy()
    expect(distSlot.flags.DISTRIBUTION_reason).toMatch(/Goal: 2×/)
    expect(distSlot.flags.DISTRIBUTION_reason).toMatch(/Arts/)
    expect(distSlot.flags.DISTRIBUTION_reason).toMatch(/Aleph/)
  })
})

describe('max one activity per group per day', () => {
  it('never places the same activity twice in one day for the same group', () => {
    const block2 = { id: 'b2', name: 'Afternoon', start_time: '14:00', end_time: '15:30', sort_order: 1, part_of_day: 'afternoon' }
    // Only one activity available — without the constraint it would fill both slots
    const act = {
      id: 'a1', name: 'Arts', priority: 'high', max_per_week: 5, min_per_week: 0,
      is_outdoor: false, location: null, max_groups_per_slot: 1, same_tier_only: false,
      eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: null, prefer_before_day_min: null,
      exclusive_with_ids: [],
    }
    const { slots } = buildSchedule(minimal({ timeBlocks: [baseBlock, block2], activities: [act] }))
    const actSlots = slots.filter(s => s.activityId === 'a1')
    expect(actSlots.length).toBe(1) // placed once, second slot is UNFILLABLE
  })
})

describe('anchor blocked_activity_ids constraint', () => {
  it('prevents a blocked activity from being placed on the same day as its anchor', () => {
    const block2 = { id: 'b2', name: 'Afternoon', start_time: '14:00', end_time: '15:30', sort_order: 1, part_of_day: 'afternoon' }
    const swimAnchor = { id: 'anc1', day_id: 'd1', time_block_id: 'b1', is_all_groups: true, group_ids: [], blocked_activity_ids: ['a1'] }
    const waterplay = {
      id: 'a1', name: 'Water Play', priority: 'high', max_per_week: 5, min_per_week: 0,
      is_outdoor: false, location: null, max_groups_per_slot: 1, same_tier_only: false,
      eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: null, prefer_before_day_min: null,
      exclusive_with_ids: [],
    }
    const arts = {
      id: 'a2', name: 'Arts', priority: 'high', max_per_week: 5, min_per_week: 0,
      is_outdoor: false, location: null, max_groups_per_slot: 1, same_tier_only: false,
      eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: null, prefer_before_day_min: null,
      exclusive_with_ids: [],
    }
    const { slots } = buildSchedule(minimal({
      timeBlocks: [baseBlock, block2],
      activities: [waterplay, arts],
      anchors: [swimAnchor],
    }))
    // Swim anchor is on d1/b1 and blocks Water Play — Water Play must not appear on d1 at all
    const waterOnD1 = slots.find(s => s.activityId === 'a1' && s.dayId === 'd1')
    expect(waterOnD1).toBeFalsy()
  })

  it('does not block the activity on other days', () => {
    const day2 = { id: 'd2', label: 'Tuesday', day_of_week: 2, sort_order: 1 }
    const swimAnchor = { id: 'anc1', day_id: 'd1', time_block_id: 'b1', is_all_groups: true, group_ids: [], blocked_activity_ids: ['a1'] }
    const waterplay = {
      id: 'a1', name: 'Water Play', priority: 'high', max_per_week: 5, min_per_week: 0,
      is_outdoor: false, location: null, max_groups_per_slot: 1, same_tier_only: false,
      eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: null, prefer_before_day_min: null,
      exclusive_with_ids: [],
    }
    const { slots } = buildSchedule(minimal({
      days: [baseDay, day2],
      activities: [waterplay],
      anchors: [swimAnchor],
    }))
    // Water Play is blocked on d1 (has swim anchor) but should be placed on d2
    const waterOnD2 = slots.find(s => s.activityId === 'a1' && s.dayId === 'd2')
    expect(waterOnD2).toBeTruthy()
  })
})

describe('exclusive_with_ids constraint', () => {
  it('never places two mutually exclusive activities on the same day for the same group', () => {
    const day2 = { id: 'd2', label: 'Tuesday', day_of_week: 2, sort_order: 1 }
    const block2 = { id: 'b2', name: 'Afternoon', start_time: '14:00', end_time: '15:30', sort_order: 1, part_of_day: 'afternoon' }
    const swim = {
      id: 'a1', name: 'Swim', priority: 'high', max_per_week: 5, min_per_week: 0,
      is_outdoor: false, location: null, max_groups_per_slot: 1, same_tier_only: false,
      eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: null, prefer_before_day_min: null,
      exclusive_with_ids: ['a2'],
    }
    const waterplay = {
      id: 'a2', name: 'Waterplay', priority: 'high', max_per_week: 5, min_per_week: 0,
      is_outdoor: false, location: null, max_groups_per_slot: 1, same_tier_only: false,
      eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: null, prefer_before_day_min: null,
      exclusive_with_ids: ['a1'],
    }
    const { slots } = buildSchedule(minimal({
      days: [baseDay, day2],
      timeBlocks: [baseBlock, block2],
      activities: [swim, waterplay],
    }))
    const actSlots = slots.filter(s => s.type === 'activity' && s.activityId)
    const swimDays = actSlots.filter(s => s.activityId === 'a1').map(s => s.dayId)
    const waterDays = actSlots.filter(s => s.activityId === 'a2').map(s => s.dayId)
    const conflict = swimDays.some(d => waterDays.includes(d))
    expect(conflict).toBe(false)
  })

  it('respects exclusive_with_ids for preplaced slots too', () => {
    const block2 = { id: 'b2', name: 'Afternoon', start_time: '14:00', end_time: '15:30', sort_order: 1, part_of_day: 'afternoon' }
    const swim = {
      id: 'a1', name: 'Swim', priority: 'high', max_per_week: 5, min_per_week: 0,
      is_outdoor: false, location: null, max_groups_per_slot: 1, same_tier_only: false,
      eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: null, prefer_before_day_min: null,
      exclusive_with_ids: ['a2'],
    }
    const waterplay = {
      id: 'a2', name: 'Waterplay', priority: 'high', max_per_week: 5, min_per_week: 0,
      is_outdoor: false, location: null, max_groups_per_slot: 1, same_tier_only: false,
      eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: null, prefer_before_day_min: null,
      exclusive_with_ids: ['a1'],
    }
    // Preplaced swim on d1/b1 → waterplay must NOT appear anywhere on d1
    const preplaced = [{ groupId: 'g1', dayId: 'd1', blockId: 'b1', activityId: 'a1' }]
    const { slots } = buildSchedule(minimal({
      timeBlocks: [baseBlock, block2],
      activities: [swim, waterplay],
      preplacedSlots: preplaced,
    }))
    const waterOnD1 = slots.find(s => s.activityId === 'a2' && s.dayId === 'd1')
    expect(waterOnD1).toBeFalsy()
  })
})

describe('co-occupancy preference', () => {
  it('places a second same-tier group into an already-occupied multi-group slot', () => {
    const g2 = { id: 'g2', name: 'Bet', tier_id: 't1', availability: 'all' }
    const block2 = { id: 'b2', name: 'Afternoon', start_time: '14:00', end_time: '15:30', sort_order: 1, part_of_day: 'afternoon' }
    const pool = {
      id: 'a1', name: 'Pool', priority: 'high', max_per_week: 5, min_per_week: 0,
      is_outdoor: false, location: 'pool', max_groups_per_slot: 2, same_tier_only: true,
      eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: null, prefer_before_day_min: null,
    }
    const arts = {
      id: 'a2', name: 'Arts', priority: 'high', max_per_week: 5, min_per_week: 0,
      is_outdoor: false, location: null, max_groups_per_slot: 1, same_tier_only: false,
      eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: null, prefer_before_day_min: null,
    }
    // Lock g1 at pool/d1/b1 — seeds locationUsage with 1 occupant before pass 2
    const preplaced = [{ groupId: 'g1', dayId: 'd1', blockId: 'b1', activityId: 'a1' }]
    const { slots } = buildSchedule({
      groups: [baseGroup, g2],
      tiers: [{ id: 't1', name: 'Junior' }],
      days: [baseDay],
      timeBlocks: [baseBlock, block2],
      activities: [pool, arts],
      anchors: [],
      campId: 'test',
      preplacedSlots: preplaced,
    })
    // g2 should co-locate with g1 at pool/d1/b1, not scatter to b2
    const g2PoolAtB1 = slots.find(s => s.groupId === 'g2' && s.activityId === 'a1' && s.blockId === 'b1')
    expect(g2PoolAtB1).toBeTruthy()
  })
})

describe('preplacedSlots (locking)', () => {
  it('keeps a preplaced slot even when another activity would be preferred', () => {
    const swim = { id: 'a1', name: 'Swimming', priority: 'high', max_per_week: 5, min_per_week: 0, is_outdoor: false, location: null, max_groups_per_slot: 1, same_tier_only: false, eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: null, prefer_before_day_min: null }
    const arch = { id: 'a2', name: 'Archery', priority: 'high', max_per_week: 5, min_per_week: 0, is_outdoor: false, location: null, max_groups_per_slot: 1, same_tier_only: false, eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: null, prefer_before_day_min: null }
    const preplaced = [{ groupId: 'g1', dayId: 'd1', blockId: 'b1', activityId: 'a2' }]
    const { slots } = buildSchedule(minimal({ activities: [swim, arch], preplacedSlots: preplaced }))
    const slot = slots.find(s => s.groupId === 'g1' && s.dayId === 'd1' && s.blockId === 'b1')
    expect(slot?.activityId).toBe('a2')
  })

  it('counts preplaced slots toward usageCount', () => {
    const day2 = { id: 'd2', label: 'Tuesday', day_of_week: 2, sort_order: 1 }
    const block2 = { id: 'b2', name: 'Afternoon', start_time: '14:00', end_time: '15:30', sort_order: 1, part_of_day: 'afternoon' }
    const swim = { id: 'a1', name: 'Swimming', priority: 'low', max_per_week: 1, min_per_week: 0, is_outdoor: false, location: null, max_groups_per_slot: 1, same_tier_only: false, eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: null, prefer_before_day_min: null }
    const preplaced = [{ groupId: 'g1', dayId: 'd1', blockId: 'b1', activityId: 'a1' }]
    const { slots } = buildSchedule(minimal({ days: [baseDay, day2], timeBlocks: [baseBlock, block2], activities: [swim], preplacedSlots: preplaced }))
    const swimSlots = slots.filter(s => s.activityId === 'a1')
    expect(swimSlots.length).toBe(1) // only the preplaced one, max_per_week=1 exhausted
  })

  it('ignores preplacedSlots param when undefined', () => {
    const act = { id: 'a1', name: 'Swimming', priority: 'low', max_per_week: 5, min_per_week: 0, is_outdoor: false, location: null, max_groups_per_slot: 1, same_tier_only: false, eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: null, prefer_before_day_min: null }
    expect(() => buildSchedule(minimal({ activities: [act] }))).not.toThrow()
  })

  it('populates locationUsage for preplaced slots so capacity is respected', () => {
    // Pool has max_groups_per_slot = 2. Preplaced one group. Another group should fill the same slot (capacity allows it).
    // A third group should NOT be placed there if capacity would be exceeded.
    const day2 = { id: 'd2', label: 'Tuesday', day_of_week: 2, sort_order: 1 }
    const g2 = { id: 'g2', name: 'Bet', tier_id: 't1', availability: 'all' }
    const g3 = { id: 'g3', name: 'Gimel', tier_id: 't1', availability: 'all' }
    const pool = {
      id: 'a1', name: 'Pool', priority: 'high', max_per_week: 5, min_per_week: 0,
      is_outdoor: false, location: 'pool', max_groups_per_slot: 2, same_tier_only: false,
      eligible_tier_ids: [], eligible_group_ids: [], prefer_before_day: null, prefer_before_day_min: null
    }
    const preplaced = [{ groupId: 'g1', dayId: 'd1', blockId: 'b1', activityId: 'a1' }]
    const { slots } = buildSchedule({
      groups: [baseGroup, g2, g3],
      tiers: [{ id: 't1', name: 'Junior' }],
      days: [baseDay],
      timeBlocks: [baseBlock],
      activities: [pool],
      anchors: [],
      campId: 'test',
      preplacedSlots: preplaced,
    })
    // g1 is preplaced at d1/b1. g2 should also get pool there (capacity=2). g3 should NOT.
    const poolSlotsAtB1 = slots.filter(s => s.activityId === 'a1' && s.dayId === 'd1' && s.blockId === 'b1')
    expect(poolSlotsAtB1.length).toBe(2) // g1 (preplaced) + g2, not g3
    expect(poolSlotsAtB1.map(s => s.groupId).sort()).toEqual(['g1', 'g2'].sort())
  })
})
