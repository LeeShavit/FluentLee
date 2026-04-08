export function ProficiencyBar({ stats }) {
  const { total, new: newCount = 0, recognized = 0, recalled = 0, mastered = 0 } = stats || {}

  if (!total || total === 0) {
    return <div className="h-2 w-full rounded-full bg-gray-200" />
  }

  const newPercent = (newCount / total) * 100
  const recognizedPercent = (recognized / total) * 100
  const recalledPercent = (recalled / total) * 100
  const masteredPercent = (mastered / total) * 100

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200">
      {newPercent > 0 && (
        <div
          className="bg-gray-400"
          style={{ width: `${newPercent}%` }}
          title={`New: ${newCount}`}
        />
      )}
      {recognizedPercent > 0 && (
        <div
          className="bg-blue-500"
          style={{ width: `${recognizedPercent}%` }}
          title={`Recognized: ${recognized}`}
        />
      )}
      {recalledPercent > 0 && (
        <div
          className="bg-amber-500"
          style={{ width: `${recalledPercent}%` }}
          title={`Recalled: ${recalled}`}
        />
      )}
      {masteredPercent > 0 && (
        <div
          className="bg-green-500"
          style={{ width: `${masteredPercent}%` }}
          title={`Mastered: ${mastered}`}
        />
      )}
    </div>
  )
}
