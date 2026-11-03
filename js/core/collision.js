/** AABB kollisioon. Sobib mis tahes objektile, millel on x, y, width, height. */
export function intersects(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}
