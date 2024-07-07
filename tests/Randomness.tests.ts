import { randomShard } from "../src/Utils";

test("Test Randomness", async () => {
  let results = [0, 0, 0, 0, 0, 0, 0, 0];
  let amount = 100_000_000;

  for (let i = 0; i < amount; i++) {
    let index = randomShard();
    results[index]++;
  }

  let expected_distr = [0.354, 0.266, 0.184, 0.105, 0.05, 0.03, 0.01, 0.001];

  for (let i = 0; i < 8; i++) {
    console.log(i, results[i] / amount);
    let rel_diff =
      (results[i] / amount - expected_distr[i]) / expected_distr[i];
    expect(rel_diff).toBeLessThanOrEqual(0.1);
  }
});
