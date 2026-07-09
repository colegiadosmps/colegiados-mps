import deleteBin from "../assets/lotties/delete-bin.json";
import emptyCalendar from "../assets/lotties/empty-calendar.json";
import emptySearch from "../assets/lotties/empty-search.json";
import empty from "../assets/lotties/empty.json";
import errorAnimation from "../assets/lotties/error-animation.json";
import importCsv from "../assets/lotties/import-csv.json";
import loadingBase from "../assets/lotties/loading-base.json";
import successAnimation from "../assets/lotties/success-animation.json";
import successSaved from "../assets/lotties/success-saved.json";
import syncDrive from "../assets/lotties/sync-drive.json";

export const lottieMap = {
  "loading-base": loadingBase,
  "sync-drive": syncDrive,
  "import-csv": importCsv,
  success: successAnimation,
  "success-saved": successSaved,
  error: errorAnimation,
  empty,
  "empty-calendar": emptyCalendar,
  "empty-search": emptySearch,
  "delete-bin": deleteBin,
};

export const getLottieByName = (name) => lottieMap[name] || null;
