# Fast Code

This documentaion provides codes that make your application faster.

## Make Libraries download fast

### 1e3 instead of 1000

Each Characterr takes up exactly one byte.
Libraries like DayJS use this technique to keep the final bunded size as small as possible.
It does not make your app faster, but it makes npm-modules to be downloaded faster.

```js
export const MILLISECONDS_A_SECOND = 1000;
export const MILLISECONDS_A_SECOND = 1e3;
```

### write a string insted of an array

```js
// two brackets and a single double quote for each element in the array
//  takes up 9 bytes more than the one defined in string.
const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const weekdays =
  "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_");
```
