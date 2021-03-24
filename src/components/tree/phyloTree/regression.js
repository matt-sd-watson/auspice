import { sum } from "d3-array";
import { formatDivergence } from "./helpers";


/**
 * this function calculates a regression between
 * the x and y values of terminal nodes, passing through
 * nodes[0].
 * It does not consider which tips are inView / visible.
 */
export function calculateRegressionThroughRoot(nodes, yScale) {
  const terminalNodes = nodes.filter((d) => d.terminal);
  const nTips = terminalNodes.length;
  const offset = nodes[0].x;
  const XY = sum(
    terminalNodes.map((d) => (d.y) * (d.x - offset))
  ) / nTips;
  const secondMomentTime = sum(
    terminalNodes
      .map((d) => (d.x - offset) * (d.x - offset))
  ) / nTips;
  const slope = XY / secondMomentTime;
  const intercept = -offset * slope;

  const text = getRateEstimate(slope, yScale.domain()[0]);

  return {slope, intercept, text};
}

/**
 * Calculate regression through terminal nodes which have both x & y values
 * set. These values must be numeric.
 * This function does not consider which tips are inView / visible.
 */
export function calculateRegressionWithFreeIntercept(nodes) {
  const terminalNodesWithXY = nodes.filter((d) => d.terminal && d.x!==undefined && d.y!==undefined);
  const nTips = terminalNodesWithXY.length;
  const meanX = sum(terminalNodesWithXY.map((d) => d.x))/nTips;
  const meanY = sum(terminalNodesWithXY.map((d) => d.y))/nTips;
  const slope = sum(terminalNodesWithXY.map((d) => (d.x-meanX)*(d.y-meanY))) /
    sum(terminalNodesWithXY.map((d) => (d.x-meanX)**2));
  const intercept = meanY - slope*meanX;
  const r2 = 1 - sum(terminalNodesWithXY.map((d) => (d.y - (intercept + slope*d.x))**2)) /
    sum(terminalNodesWithXY.map((d) => (d.y - meanY)**2));
  const text = `y = ${intercept.toPrecision(3)} + ${slope.toPrecision(3)}x. R2 = ${r2.toPrecision(3)}`;
  return {slope, intercept, text};
}


function getRateEstimate(regressionSlope, maxDivergence) {
  /* Prior to Jan 2020, the divergence measure was always "subs per site per year"
    however certain datasets chaged this to "subs per year" across entire sequence.
    This distinction is not set in the JSON, so in order to correctly display the rate
    we will "guess" this here. A future augur update will export this in a JSON key,
    removing the need to guess */
  if (maxDivergence > 5) {
    return `rate estimate: ${formatDivergence(regressionSlope)} subs per year`;
  }
  return `rate estimate: ${regressionSlope.toExponential(2)} subs per site per year`;
}
