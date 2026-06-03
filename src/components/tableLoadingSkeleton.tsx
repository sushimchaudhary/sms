
export default function TableLoadingSkeleton({ rows = 3, cols = 5 }: { rows?: number, cols?: number }) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <tr key={i} className="border-b border-gray-200">
          {[...Array(cols)].map((_, j) => (
            <td key={j} className="p-2">
              <div className="p-2 bg-gray-300 animate-pulse rounded w-3/4"></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
} 