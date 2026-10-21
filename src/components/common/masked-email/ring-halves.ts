/**
 * The mask's progress ring, as geometry. It is measured rather than drawn with
 * percentages, which is why the box it fills has to be passed in.
 */

export type Box = {
  // Border-box pixels, as measured.
  width: number;
  height: number;
  radius: number;
};

/**
 * Builds the ring as two halves, both starting at the bottom centre and ending
 * at the top centre, so they travel in opposite directions and meet.
 *
 * Measured rather than drawn with percentages: where the bottom centre falls
 * along a rounded rectangle depends on its proportions, so one fixed dash
 * offset cannot hit it at every width.
 *
 * @returns The right-hand path and the left-hand path.
 */
export function ringHalves({ width, height, radius }: Box): [string, string] {
  const corner = Math.min(radius, width / 2, height / 2);
  const middle = width / 2;

  const right = `M ${middle} ${height} H ${width - corner} A ${corner} ${corner} 0 0 0 ${width} ${height - corner} V ${corner} A ${corner} ${corner} 0 0 0 ${width - corner} 0 H ${middle}`;
  const left = `M ${middle} ${height} H ${corner} A ${corner} ${corner} 0 0 1 0 ${height - corner} V ${corner} A ${corner} ${corner} 0 0 1 ${corner} 0 H ${middle}`;

  return [right, left];
}
