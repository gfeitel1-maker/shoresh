import React, { useRef } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'

const ACTIVITY_COLORS = ['#00ADBB','#2F7DE1','#00AA59','#A63595','#F0585D','#7DC433']
export const ANCHOR_COLOR = '#A63595'

export const FLAG_COLORS = {
  UNFILLABLE: '#F0585D',
  UNDERSERVED: '#F5A623',
  WEATHER_RISK: '#2F7DE1',
  DISTRIBUTION: '#7DC433',
}

const REAL_FLAG_NAMES = new Set(Object.keys(FLAG_COLORS))

export function activityColor(idx) { return ACTIVITY_COLORS[idx % ACTIVITY_COLORS.length] }

export const cellTd = { padding: '5px 4px', verticalAlign: 'top', cursor: 'pointer' }
export const emptyTd = { padding: '5px 4px', verticalAlign: 'top' }

export default function SlotCell({ slot, activity, anchor, actColorIdx, weatherMode, onEdit, onLock, onRelease, isLocked, isDndEnabled }) {
  const id = slot ? `${slot.groupId}|${slot.dayId}|${slot.blockId}` : 'empty'
  const canDrag = isDndEnabled && slot?.type === 'activity' && !isLocked

  const clickTimer = useRef(null)

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id,
    disabled: !canDrag,
    data: { slot },
  })
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${id}`,
    disabled: !isDndEnabled || Boolean(isLocked),
    data: { slot },
  })

  const setRef = el => { setDragRef(el); setDropRef(el) }

  if (!slot) return <td style={emptyTd} />

  if (slot.type === 'anchor') {
    return (
      <td ref={setRef} style={cellTd} onClick={() => onEdit(slot)}>
        <div style={{
          background: '#F3E8FA',
          border: '1.5px solid #A6359566',
          borderRadius: 10,
          padding: '10px 10px',
          minHeight: 80,
          display: 'flex',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: ANCHOR_COLOR, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {anchor?.name || 'Anchor'}
          </div>
        </div>
      </td>
    )
  }

  if (slot.type === 'unavailable') {
    return (
      <td ref={setRef} style={emptyTd}>
        <div style={{ background: 'var(--bg)', border: '1.5px dashed #D8C8B8', borderRadius: 10, minHeight: 80, opacity: 0.5 }} />
      </td>
    )
  }

  const flags = slot.flags || {}
  const activeFlags = Object.keys(flags).filter(f => REAL_FLAG_NAMES.has(f) && !flags[`${f}_dismissed`])
  const hasFlags = activeFlags.length > 0
  const isOutdoor = flags.WEATHER_RISK && !flags.WEATHER_RISK_dismissed
  const color = activity ? activityColor(actColorIdx) : null
  const isWeatherHighlight = weatherMode && isOutdoor

  function handleClick() {
    if (!activity) { onEdit(slot); return }
    if (isLocked) { onRelease?.(slot); return }
    if (onLock && clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      onLock(slot)
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null
        onEdit(slot)
      }, 300)
    }
  }

  function handleContextMenu(e) {
    e.preventDefault()
    clearTimeout(clickTimer.current)
    clickTimer.current = null
    onEdit(slot)
  }

  const lockedInnerStyle = {
    background: '#FFFBF0',
    border: '2px solid #E8A020',
    borderRadius: 10,
    padding: '10px 10px',
    minHeight: 80,
    position: 'relative',
    overflow: 'hidden',
  }

  const normalInnerStyle = activity
    ? {
        background: `${color}1E`,
        border: isWeatherHighlight ? `2px solid #2F7DE1` : `1.5px solid ${color}55`,
        borderRadius: 10,
        padding: '10px 10px',
        minHeight: 80,
        opacity: isDragging ? 0.4 : 1,
        outline: isOver && isDndEnabled ? '2px solid var(--primary)' : 'none',
        outlineOffset: -2,
        position: 'relative',
      }
    : {
        background: 'var(--bg)',
        border: '1.5px dashed #D8C8B8',
        borderRadius: 10,
        padding: '10px 10px',
        minHeight: 80,
        position: 'relative',
      }

  const innerStyle = isLocked ? lockedInnerStyle : normalInnerStyle

  const tooltipParts = [activity?.name || 'Unassigned']
  for (const f of activeFlags) {
    if (flags[`${f}_reason`]) tooltipParts.push(flags[`${f}_reason`])
  }
  const tooltipText = tooltipParts.join('\n')

  return (
    <td
      ref={setRef}
      style={{
        ...cellTd,
        cursor: canDrag ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
      }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={tooltipText}
      {...(canDrag ? { ...listeners, ...attributes } : {})}
    >
      <div style={innerStyle}>
        {isLocked && (
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 0, height: 0,
            borderTop: '10px solid #E8A020',
            borderLeft: '10px solid transparent',
          }} />
        )}
        <div style={{
          fontSize: 13,
          fontWeight: activity ? 700 : 500,
          color: isLocked ? '#7A5100' : (activity ? color : '#B0A090'),
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {activity?.name || <span style={{ fontSize: 11 }}>Unassigned</span>}
        </div>
        {hasFlags && !isLocked && (
          <div style={{ display: 'flex', gap: 3, marginTop: 5, flexWrap: 'wrap' }}>
            {activeFlags.map(f => (
              <span
                key={f}
                style={{ width: 6, height: 6, borderRadius: '50%', background: FLAG_COLORS[f], display: 'inline-block' }}
                title={flags[`${f}_reason`] || f}
              />
            ))}
          </div>
        )}
      </div>
    </td>
  )
}
