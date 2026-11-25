export default function Grid({
  ships = [],
  showShips,
  revealShips = [],
  color,
  onClick,
  onHover,
  hoverCells = [],
  attacks = [] // ✅ NEW
}) {

  function isShip(i,j){
    return ships.some(s =>
      s.positions.some(p => p.x === i && p.y === j)
    );
  }

  function isRevealedShip(i,j){
    return revealShips.some(s =>
      s.positions.some(p => p.x === i && p.y === j)
    );
  }

  function getAttack(i,j){
    return attacks.find(a => a.x === i && a.y === j);
  }

  return (
    <div className="grid">
      {[...Array(4)].map((_, i) =>
        [...Array(5)].map((_, j) => {
          const key = `${i}-${j}`;
          const attack = getAttack(i,j);

          return (
            <div
              key={key}
              className={`cell 
                ${attack ? "attacked" : ""}
                ${attack?.hit ? "hit" : ""}
                ${hoverCells.includes(key) ? "preview" : ""}
              `}
              style={{
                background:
                  (showShips && isShip(i,j)) || isRevealedShip(i,j)
                    ? color
                    : attack
                    ? "#1f3b4d"
                    : undefined,
                cursor: attack ? "not-allowed" : "pointer"
              }}
              onMouseEnter={() => onHover && onHover(i,j)}
              onClick={() => {
                if (attack) return; // ❌ block repeat
                if (onClick) onClick(i,j);
              }}
            >
              {attack?.hit && "💥"}
            </div>
          );
        })
      )}
    </div>
  );
}