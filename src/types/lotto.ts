export type LottoDraw = {
  round: number;
  drawDate: string;
  numbers: number[];
  bonus: number;
};

export type OfficialLottoApiResponse = {
  totSellamnt: number;
  returnValue: string;
  drwNoDate: string;
  firstWinamnt: number;
  drwtNo6: number;
  drwtNo4: number;
  firstPrzwnerCo: number;
  drwtNo5: number;
  bnusNo: number;
  firstAccumamnt: number;
  drwNo: number;
  drwtNo2: number;
  drwtNo3: number;
  drwtNo1: number;
};