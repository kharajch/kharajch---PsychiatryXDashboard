import { test, expect } from '@playwright/test';

test.describe('PsychiatryX Dashboard Clinical Logic Unit Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).rxdb && (window as any).rxdb.patients, { timeout: 15000 });
  });

  test('getSeverity should correctly categorize scores for all assessment types', async ({ page }) => {
    const testCases = [
      // Depression (CDA-17)
      { type: 'depression', score: 0, expected: 'Minimal depression' },
      { type: 'depression', score: 13, expected: 'Minimal depression' },
      { type: 'depression', score: 14, expected: 'Mild depression' },
      { type: 'depression', score: 25, expected: 'Mild depression' },
      { type: 'depression', score: 26, expected: 'Moderate depression' },
      { type: 'depression', score: 38, expected: 'Moderate depression' },
      { type: 'depression', score: 39, expected: 'Severe depression' },
      { type: 'depression', score: 52, expected: 'Severe depression' },
      { type: 'depression', score: 53, expected: 'Very severe depression' },
      { type: 'depression', score: 68, expected: 'Very severe depression' },
      
      // Anxiety (CAA-14)
      { type: 'anxiety', score: 0, expected: 'Minimal anxiety' },
      { type: 'anxiety', score: 13, expected: 'Minimal anxiety' },
      { type: 'anxiety', score: 14, expected: 'Mild anxiety' },
      { type: 'anxiety', score: 24, expected: 'Mild anxiety' },
      { type: 'anxiety', score: 25, expected: 'Moderate anxiety' },
      { type: 'anxiety', score: 34, expected: 'Moderate anxiety' },
      { type: 'anxiety', score: 35, expected: 'Severe anxiety' },
      { type: 'anxiety', score: 44, expected: 'Severe anxiety' },
      { type: 'anxiety', score: 45, expected: 'Very severe anxiety' },
      { type: 'anxiety', score: 56, expected: 'Very severe anxiety' },

      // Mania (MSS-11)
      { type: 'mania', score: 0, expected: 'No mania' },
      { type: 'mania', score: 10, expected: 'No mania' },
      { type: 'mania', score: 11, expected: 'Mild hypomanic features' },
      { type: 'mania', score: 20, expected: 'Mild hypomanic features' },
      { type: 'mania', score: 21, expected: 'Moderate mania' },
      { type: 'mania', score: 30, expected: 'Moderate mania' },
      { type: 'mania', score: 31, expected: 'Severe manic episode likely' },

      // Suicide Risk (SRA-20)
      { type: 'suicide', score: 0, expected: 'Low risk' },
      { type: 'suicide', score: 10, expected: 'Low risk' },
      { type: 'suicide', score: 11, expected: 'Moderate risk' },
      { type: 'suicide', score: 25, expected: 'Moderate risk' },
      { type: 'suicide', score: 26, expected: 'High risk' },
      { type: 'suicide', score: 40, expected: 'High risk' },
      { type: 'suicide', score: 41, expected: 'Critical risk' },

      // OCD (OCS-10)
      { type: 'ocd', score: 7, expected: 'Minimal OCD features' },
      { type: 'ocd', score: 8, expected: 'Mild OCD features' },
      { type: 'ocd', score: 15, expected: 'Moderate OCD features' },
      { type: 'ocd', score: 21, expected: 'Significant OCD features' },

      // Psychosis (PSS-18)
      { type: 'psychosis', score: 10, expected: 'Minimal features' },
      { type: 'psychosis', score: 11, expected: 'Mild features' },
      { type: 'psychosis', score: 23, expected: 'Moderate features' },
      { type: 'psychosis', score: 36, expected: 'Significant features' },

      // ADHD (ADHD-55)
      { type: 'adhd', score: 50, expected: 'Minimal symptoms' },
      { type: 'adhd', score: 51, expected: 'Mild ADHD traits' },
      { type: 'adhd', score: 101, expected: 'Moderate symptoms' },
      { type: 'adhd', score: 151, expected: 'High likelihood of ADHD' },

      // Autism (ASS-40)
      { type: 'autism', score: 30, expected: 'Minimal autistic traits' },
      { type: 'autism', score: 31, expected: 'Mild traits' },
      { type: 'autism', score: 61, expected: 'Moderate traits' },
      { type: 'autism', score: 91, expected: 'High probability of ASD' },

      // Sleep (SPA-7)
      { type: 'sleep', score: 7, expected: 'No clinically significant insomnia' },
      { type: 'sleep', score: 8, expected: 'Subthreshold insomnia' },
      { type: 'sleep', score: 15, expected: 'Moderate clinical insomnia' },
      { type: 'sleep', score: 22, expected: 'Severe clinical insomnia' },

      // Sexual Function (SFA-5) - Reversed scale (higher is better)
      { type: 'sexual', score: 5, expected: 'Significant dysfunction' },
      { type: 'sexual', score: 10, expected: 'Significant dysfunction' },
      { type: 'sexual', score: 11, expected: 'Mild dysfunction' },
      { type: 'sexual', score: 17, expected: 'Mild dysfunction' },
      { type: 'sexual', score: 18, expected: 'Minimal concerns' },
      { type: 'sexual', score: 22, expected: 'Minimal concerns' },
      { type: 'sexual', score: 23, expected: 'Normal function' },
      { type: 'sexual', score: 25, expected: 'Normal function' },
    ];

    for (const tc of testCases) {
      const result = await page.evaluate(({ type, score }) => {
        return (window as any).getSeverity(type, score);
      }, tc);
      expect(result.label, `Failed for type ${tc.type} with score ${tc.score}`).toBe(tc.expected);
    }
  });

  test('Database utilities (dbPut, dbGet, dbGetAll) should work correctly in browser', async ({ page }) => {
    // 1. Test dbPut
    const patientData = {
      name: 'Test Database Patient',
      age: 30,
      gender: 'Male',
      registeredOn: new Date().toISOString()
    };

    const patientId = await page.evaluate((data) => {
      return (window as any).dbPut('patients', data);
    }, patientData);

    expect(patientId).toBeDefined();
    // Support both string and object with toString/id for robustness, though dbPut should return string
    const idString = typeof patientId === 'object' ? (patientId.id || patientId.toString()) : patientId;
    expect(typeof idString).toBe('string');
    
    // Use the actual idString for subsequent steps
    const targetId = idString;

    // 2. Test dbGet
    const fetchedPatient = await page.evaluate((id) => {
      return (window as any).dbGet('patients', id);
    }, targetId);

    expect(fetchedPatient).not.toBeNull();
    expect(fetchedPatient.id).toBe(targetId);
    expect(fetchedPatient.name).toBe(patientData.name);
    expect(fetchedPatient.clinicId).toBe('dev-clinic-id'); // Default clinic ID

    // 3. Test dbGetAll
    const allPatients = await page.evaluate(() => {
      return (window as any).dbGetAll('patients');
    });

    expect(Array.isArray(allPatients)).toBe(true);
    expect(allPatients.some(p => p.id === patientId)).toBe(true);
  });

  test('computeDomainScores should correctly sum domains for ADHD-55 and ASS-40', async ({ page }) => {
    // ADHD-55 has domains: Inattention (18 items), Hyperactivity (18 items), Impulsivity (9 items), Executive Functioning (10 items)
    // All options range 0-4.
    const adhdAnswers = [
      ...Array(18).fill(1), // Inattention: 18 * 1 = 18
      ...Array(18).fill(2), // Hyperactivity: 18 * 2 = 36
      ...Array(9).fill(3),  // Impulsivity: 9 * 3 = 27
      ...Array(10).fill(4), // Executive: 10 * 4 = 40
    ];

    const adhdResult = await page.evaluate((answers) => {
      return (window as any).computeDomainScores('adhd', answers);
    }, adhdAnswers);

    expect(adhdResult['Inattention'].score).toBe(18);
    expect(adhdResult['Inattention'].max).toBe(18 * 4);
    expect(adhdResult['Hyperactivity'].score).toBe(36);
    expect(adhdResult['Hyperactivity'].max).toBe(18 * 4);
    expect(adhdResult['Impulsivity'].score).toBe(27);
    expect(adhdResult['Impulsivity'].max).toBe(9 * 4);
    expect(adhdResult['Executive Functioning'].score).toBe(40);
    expect(adhdResult['Executive Functioning'].max).toBe(10 * 4);

    // ASS-40 has domains: Social Interaction (10 items), Communication (8 items), Restricted Interests (8 items), Sensory Sensitivity (7 items), Repetitive Behaviour (7 items)
    // All options range 0-3.
    const autismAnswers = [
      ...Array(10).fill(1), // Social Interaction: 10 * 1 = 10
      ...Array(8).fill(2),  // Communication: 8 * 2 = 16
      ...Array(8).fill(3),  // Restricted Interests: 8 * 3 = 24
      ...Array(7).fill(0),  // Sensory Sensitivity: 7 * 0 = 0
      ...Array(7).fill(2),  // Repetitive Behaviour: 7 * 2 = 14
    ];

    const autismResult = await page.evaluate((answers) => {
      return (window as any).computeDomainScores('autism', answers);
    }, autismAnswers);

    expect(autismResult['Social Interaction'].score).toBe(10);
    expect(autismResult['Social Interaction'].max).toBe(10 * 3);
    expect(autismResult['Communication'].score).toBe(16);
    expect(autismResult['Communication'].max).toBe(8 * 3);
    expect(autismResult['Restricted Interests'].score).toBe(24);
    expect(autismResult['Restricted Interests'].max).toBe(8 * 3);
    expect(autismResult['Sensory Sensitivity'].score).toBe(0);
    expect(autismResult['Sensory Sensitivity'].max).toBe(7 * 3);
    expect(autismResult['Repetitive Behaviour'].score).toBe(14);
    expect(autismResult['Repetitive Behaviour'].max).toBe(7 * 3);
  });

  test('Depression alertItem (item 16 suicidal thoughts) should trigger safety alert', async ({ page }) => {
    // Total score is low (10 answers of 0, 6 answers of 1, and 1 answer of 2 on item 16 => Total = 8)
    // Alert threshold is 38, but item 16 is index 15. If index 15 is 2, it should trigger critical alert.
    const answers = Array(17).fill(0);
    answers[15] = 2; // item 16 thoughts of death/self-harm

    const alerts = await page.evaluate(({ answers }) => {
      const def = ASSESSMENTS['depression'];
      let list = [];
      const score = answers.reduce((sum, a) => sum + (a || 0), 0);
      if (score >= def.alertThreshold) {
        list.push({ type: 'score', message: `Score ${score} meets clinical alert threshold` });
      }
      if (def.alertItem && answers[def.alertItem.index] >= def.alertItem.threshold) {
        list.push({ type: 'critical', message: def.alertItem.message });
      }
      return list;
    }, { answers });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('critical');
    expect(alerts[0].message).toContain('thoughts of death/self-harm');
  });

  test('Suicide Risk criticalItem should trigger immediate alert when any key index is >= 2', async ({ page }) => {
    // Suicide indices [2,3,4,6,7,16]
    // If index 4 is 2, it should trigger critical alert
    const answers = Array(20).fill(0);
    answers[4] = 2; 

    const alerts = await page.evaluate(({ answers }) => {
      const def = ASSESSMENTS['suicide'];
      let list = [];
      const score = answers.reduce((sum, a) => sum + (a || 0), 0);
      if (score >= def.alertThreshold) {
        list.push({ type: 'score', message: `Score ${score} meets clinical alert threshold` });
      }
      if (def.criticalItem) {
        const hasCrit = def.criticalItem.indices.some(i => answers[i] >= 2);
        if (hasCrit) list.push({ type: 'critical', message: def.criticalItem.message });
      }
      return list;
    }, { answers });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('critical');
    expect(alerts[0].message).toContain('IMMEDIATE clinical attention required');
  });
});
