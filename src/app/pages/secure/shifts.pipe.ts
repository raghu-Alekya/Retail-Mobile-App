import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shifts'
})
export class ShiftsPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
