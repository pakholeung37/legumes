import { Point } from './point'
import { Shape } from './types'

export class Circle implements Shape {
  constructor(
    /** center x-coordinate */
    public readonly x: number,
    /** center y-coordinate */
    public readonly y: number,
    /** radius */
    public readonly r: number,
  ) {}

  center(): Point {
    return new Point(this.x, this.y)
  }

  contains(point: Point): boolean {
    return this.center().distance(point) <= this.r
  }

  left() {
    return this.x - this.r
  }

  right() {
    return this.x + this.r
  }

  top() {
    return this.y - this.r
  }

  bottom() {
    return this.y + this.r
  }
}
