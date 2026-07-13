/**
 * This file initializes third-party library instances that need one-time setup
 * (e.g. merging dictionaries, loading config) and exports them as singletons for
 * use across the application, so that setup cost is paid once at module load
 * rather than on every call.
 */
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";
import * as zxcvbnJaPackage from "@zxcvbn-ts/language-ja";

// It checks the password is not on the rainbow table.
// Password Complexity seems ineffective according to NIST.
// URL: https://pages.nist.gov/800-63-4/sp800-63b.html#complexity
export const zxcvbn = new ZxcvbnFactory({
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
    ...zxcvbnJaPackage.dictionary,
  },
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
});
