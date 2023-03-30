export const booleanAlgebraBoolean = {
  meet: (x: boolean, y: boolean) => x && y,
  join: (x: boolean, y: boolean) => x || y,
  zero: false,
  one: true,
  implies: (x: boolean, y: boolean) => !x || y,
  not: (x: boolean) => !x,
};
