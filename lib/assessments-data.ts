// Clinical Assessment Definitions and Scoring Utilities

export interface AssessmentOption {
  score: number;
  label: string;
}

export interface AssessmentQuestion {
  text: string;
  desc?: string;
  alert?: boolean;
  domain?: string;
}

export interface SeverityThreshold {
  max: number;
  label: string;
  color: string;
  badge: string;
}

export interface DomainInfo {
  name: string;
  items: number;
}

export interface AssessmentDefinition {
  name: string;
  short: string;
  icon: string;
  timeframe: string;
  maxScore: number;
  options: AssessmentOption[];
  questions: AssessmentQuestion[];
  thresholds: SeverityThreshold[];
  alertThreshold: number;
  alertItem?: { index: number; threshold: number; message: string };
  criticalItem?: { indices: number[]; message: string };
  note?: string;
  domains?: DomainInfo[];
}

export const ASSESSMENTS: Record<string, AssessmentDefinition> = {
  anxiety: {
    name: 'Clinical Anxiety Assessment', short: 'CAA-14', icon: '😰',
    timeframe: 'Past 7 days', maxScore: 56,
    options: [
      {score:0,label:'Not present'},
      {score:1,label:'Mild'},
      {score:2,label:'Moderate'},
      {score:3,label:'Marked'},
      {score:4,label:'Severe'}
    ],
    questions: [
      {text:'Subjective anxious mood',desc:'Persistent feelings of worry, tension, or nervousness.'},
      {text:'Inner tension / restlessness',desc:'Difficulty relaxing, feeling keyed up.'},
      {text:'Fear or anticipatory anxiety',desc:'Fear of something bad happening without clear reason.'},
      {text:'Sleep disturbance due to anxiety',desc:'Difficulty falling asleep, restless sleep.'},
      {text:'Cognitive difficulty due to anxiety',desc:'Poor concentration or mental fatigue.'},
      {text:'Depressive mood associated with anxiety',desc:'Sadness, discouragement, hopeless feelings.'},
      {text:'Muscular tension',desc:'Body stiffness, aches, trembling, muscle tension.'},
      {text:'Sensory sensitivity',desc:'Heightened sensitivity to noise, light, or touch.'},
      {text:'Cardiovascular symptoms',desc:'Palpitations, chest discomfort, rapid heartbeat.'},
      {text:'Respiratory symptoms',desc:'Shortness of breath, chest tightness.'},
      {text:'Gastrointestinal symptoms',desc:'Nausea, abdominal discomfort, indigestion.'},
      {text:'Autonomic symptoms',desc:'Sweating, dry mouth, dizziness.'},
      {text:'Observable anxious behavior',desc:'Fidgeting, restlessness, pacing.'},
      {text:'Impact on daily functioning',desc:'Anxiety interfering with work or social activities.'}
    ],
    thresholds: [
      {max:13,label:'Minimal anxiety',color:'#059669',badge:'badge-minimal'},
      {max:24,label:'Mild anxiety',color:'#10b981',badge:'badge-mild'},
      {max:34,label:'Moderate anxiety',color:'#d97706',badge:'badge-moderate'},
      {max:44,label:'Severe anxiety',color:'#e63946',badge:'badge-severe'},
      {max:56,label:'Very severe anxiety',color:'#7c3aed',badge:'badge-verysevere'}
    ],
    alertThreshold: 34
  },
  depression: {
    name: 'Clinical Depression Assessment', short: 'CDA-17', icon: '😔',
    timeframe: 'Past 2 weeks', maxScore: 68,
    options: [
      {score:0,label:'Absent'},
      {score:1,label:'Mild'},
      {score:2,label:'Moderate'},
      {score:3,label:'Marked'},
      {score:4,label:'Severe'}
    ],
    questions: [
      {text:'Depressed mood',desc:'Persistent sadness or low mood.'},
      {text:'Loss of interest or pleasure',desc:'Reduced enjoyment in usual activities.'},
      {text:'Feelings of guilt or self-blame',desc:''},
      {text:'Reduced energy or fatigue',desc:''},
      {text:'Sleep onset difficulty',desc:''},
      {text:'Frequent night awakenings',desc:''},
      {text:'Early morning awakening',desc:''},
      {text:'Reduced appetite',desc:''},
      {text:'Weight change',desc:''},
      {text:'Psychomotor slowing',desc:''},
      {text:'Psychomotor agitation',desc:''},
      {text:'Poor concentration',desc:''},
      {text:'Hopelessness about the future',desc:''},
      {text:'Social withdrawal',desc:''},
      {text:'Loss of confidence or self-esteem',desc:''},
      {text:'Thoughts about death or self-harm',desc:'⚠️ Sensitive item — answer honestly for best care.',alert:true},
      {text:'Functional impairment due to depressive symptoms',desc:''}
    ],
    thresholds: [
      {max:13,label:'Minimal depression',color:'#059669',badge:'badge-minimal'},
      {max:25,label:'Mild depression',color:'#10b981',badge:'badge-mild'},
      {max:38,label:'Moderate depression',color:'#d97706',badge:'badge-moderate'},
      {max:52,label:'Severe depression',color:'#e63946',badge:'badge-severe'},
      {max:68,label:'Very severe depression',color:'#7c3aed',badge:'badge-verysevere'}
    ],
    alertThreshold: 38,
    alertItem: {index:15, threshold:2, message:'Elevated thoughts of death/self-harm (Item 16) — consider immediate clinical safety review'}
  },
  mania: {
    name: 'Mania Screening Scale', short: 'MSS-11', icon: '⚡',
    timeframe: 'Past 7 days', maxScore: 44,
    options: [
      {score:0,label:'Absent'},
      {score:1,label:'Mild'},
      {score:2,label:'Moderate'},
      {score:3,label:'Marked'},
      {score:4,label:'Severe'}
    ],
    questions: [
      {text:'Elevated or unusually cheerful mood',desc:''},
      {text:'Irritable mood',desc:''},
      {text:'Increased energy or activity level',desc:''},
      {text:'Reduced need for sleep',desc:''},
      {text:'Rapid or pressured speech',desc:''},
      {text:'Racing thoughts',desc:''},
      {text:'Distractibility',desc:''},
      {text:'Inflated self-confidence or grandiosity',desc:''},
      {text:'Impulsive or risky behavior',desc:''},
      {text:'Increased goal-directed activity',desc:''},
      {text:'Poor insight into behavioral change',desc:''}
    ],
    thresholds: [
      {max:10,label:'No mania',color:'#059669',badge:'badge-minimal'},
      {max:20,label:'Mild hypomanic features',color:'#d97706',badge:'badge-mild'},
      {max:30,label:'Moderate mania',color:'#e63946',badge:'badge-severe'},
      {max:44,label:'Severe manic episode likely',color:'#7c3aed',badge:'badge-verysevere'}
    ],
    alertThreshold: 20
  },
  suicide: {
    name: 'Suicide Risk Assessment', short: 'SRA-20', icon: '⚠️',
    timeframe: 'Past 2 weeks', maxScore: 60,
    options: [
      {score:0,label:'Not at all'},
      {score:1,label:'Occasionally'},
      {score:2,label:'Often'},
      {score:3,label:'Very often'}
    ],
    questions: [
      {text:'Do you feel life is not worth living?',desc:''},
      {text:'Have you wished you could fall asleep and not wake up?',desc:''},
      {text:'Have you had thoughts about ending your life?',desc:''},
      {text:'Have you thought about how you might harm yourself?',desc:''},
      {text:'Have you imagined specific situations where you might die intentionally?',desc:''},
      {text:'Do you feel that others would be better off without you?',desc:''},
      {text:'Have you made preparations for harming yourself?',desc:''},
      {text:'Have you written notes or messages suggesting goodbye?',desc:''},
      {text:'Do you feel unable to control thoughts of self-harm?',desc:''},
      {text:'Do these thoughts occur repeatedly during the day?',desc:''},
      {text:'Have you avoided seeking help despite these thoughts?',desc:''},
      {text:'Do you feel hopeless about the future?',desc:''},
      {text:'Do you feel trapped in your situation?',desc:''},
      {text:'Have you recently increased alcohol or substance use while feeling suicidal?',desc:''},
      {text:'Do you feel there is no solution to your problems?',desc:''},
      {text:'Have you rehearsed self-harm in your mind?',desc:''},
      {text:'Have you come close to acting on suicidal thoughts?',desc:''},
      {text:'Do you feel emotionally numb or detached from life?',desc:''},
      {text:'Do you believe death might bring relief?',desc:''},
      {text:'Have these thoughts increased in intensity recently?',desc:''}
    ],
    thresholds: [
      {max:10,label:'Low risk',color:'#059669',badge:'badge-minimal'},
      {max:25,label:'Moderate risk',color:'#d97706',badge:'badge-moderate'},
      {max:40,label:'High risk',color:'#e63946',badge:'badge-severe'},
      {max:60,label:'Critical risk',color:'#7c3aed',badge:'badge-verysevere'}
    ],
    alertThreshold: 15,
    criticalItem: {indices:[2,3,4,6,7,16], message:'Active suicidal ideation indicators present — IMMEDIATE clinical attention required'}
  },
  ocd: {
    name: 'OCD Screening', short: 'OCS-10', icon: '🔄',
    timeframe: 'Past 2 weeks', maxScore: 30,
    options: [
      {score:0,label:'Never'},
      {score:1,label:'Rarely'},
      {score:2,label:'Sometimes'},
      {score:3,label:'Often'}
    ],
    questions: [
      {text:'Do unwanted thoughts repeatedly enter your mind even when you try to ignore them?',desc:''},
      {text:'Do you feel compelled to check things repeatedly (locks, appliances, etc.)?',desc:''},
      {text:'Do you wash or clean excessively to reduce anxiety?',desc:''},
      {text:'Do you repeat certain actions until they feel "just right"?',desc:''},
      {text:'Do you spend a lot of time arranging objects symmetrically?',desc:''},
      {text:'Do intrusive thoughts cause significant distress?',desc:''},
      {text:'Do you perform rituals to prevent something bad from happening?',desc:''},
      {text:'Do these behaviors take more than an hour per day?',desc:''},
      {text:'Do you recognize these behaviors are excessive but struggle to stop?',desc:''},
      {text:'Do these thoughts or rituals interfere with work or daily life?',desc:''}
    ],
    thresholds: [
      {max:7,label:'Minimal OCD features',color:'#059669',badge:'badge-minimal'},
      {max:14,label:'Mild OCD features',color:'#10b981',badge:'badge-mild'},
      {max:20,label:'Moderate OCD features',color:'#d97706',badge:'badge-moderate'},
      {max:30,label:'Significant OCD features',color:'#e63946',badge:'badge-severe'}
    ],
    alertThreshold: 20
  },
  psychosis: {
    name: 'Psychosis Screening', short: 'PSS-18', icon: '🌀',
    timeframe: 'Past 4 weeks', maxScore: 54,
    options: [
      {score:0,label:'Never'},
      {score:1,label:'Rarely'},
      {score:2,label:'Sometimes'},
      {score:3,label:'Often'}
    ],
    questions: [
      {text:'Do you feel people are watching or observing you unusually closely?',desc:''},
      {text:'Do you feel others are talking about you behind your back?',desc:''},
      {text:'Do you hear voices when no one is around?',desc:''},
      {text:'Have you seen things that others could not see?',desc:''},
      {text:'Do you feel your thoughts are being controlled?',desc:''},
      {text:'Do you believe someone is trying to harm you?',desc:''},
      {text:'Do you feel messages on TV or the internet are directed specifically at you?',desc:''},
      {text:'Do your thoughts feel jumbled or difficult to organize?',desc:''},
      {text:'Do people say your speech is difficult to follow?',desc:''},
      {text:'Do you feel emotionally distant or detached from others?',desc:''},
      {text:'Do you find it hard to experience pleasure?',desc:''},
      {text:'Do you avoid social interaction because of suspicious feelings?',desc:''},
      {text:'Do you feel your thoughts are being broadcast to others?',desc:''},
      {text:'Do you struggle with motivation or energy?',desc:''},
      {text:'Do you feel confused about reality at times?',desc:''},
      {text:'Do you have unusual beliefs others find difficult to understand?',desc:''},
      {text:'Do you feel others can read your mind?',desc:''},
      {text:'Have these experiences increased recently?',desc:''}
    ],
    thresholds: [
      {max:10,label:'Minimal features',color:'#059669',badge:'badge-minimal'},
      {max:22,label:'Mild features',color:'#10b981',badge:'badge-mild'},
      {max:35,label:'Moderate features',color:'#d97706',badge:'badge-moderate'},
      {max:54,label:'Significant features',color:'#e63946',badge:'badge-severe'}
    ],
    alertThreshold: 35
  },
  sleep: {
    name: 'Sleep Problems Assessment', short: 'SPA-7', icon: '😴',
    timeframe: 'Past 2 weeks', maxScore: 28,
    options: [
      {score:0,label:'Not at all'},
      {score:1,label:'Mild'},
      {score:2,label:'Moderate'},
      {score:3,label:'Marked'},
      {score:4,label:'Severe'}
    ],
    questions: [
      {text:'Difficulty falling asleep',desc:''},
      {text:'Difficulty staying asleep',desc:''},
      {text:'Waking too early',desc:''},
      {text:'Feeling tired during the day',desc:''},
      {text:'Dissatisfaction with sleep quality',desc:''},
      {text:'Sleep interfering with daily function',desc:''},
      {text:'Worry about sleep problems',desc:''}
    ],
    thresholds: [
      {max:7,label:'No clinically significant insomnia',color:'#059669',badge:'badge-minimal'},
      {max:14,label:'Subthreshold insomnia',color:'#d97706',badge:'badge-mild'},
      {max:21,label:'Moderate clinical insomnia',color:'#e63946',badge:'badge-moderate'},
      {max:28,label:'Severe clinical insomnia',color:'#7c3aed',badge:'badge-severe'}
    ],
    alertThreshold: 14
  },
  sexual: {
    name: 'Sexual Function Assessment', short: 'SFA-5', icon: '💊',
    timeframe: 'Past 4 weeks', maxScore: 25,
    options: [
      {score:0,label:'None / No function'},
      {score:1,label:'Very low'},
      {score:2,label:'Low'},
      {score:3,label:'Moderate'},
      {score:4,label:'Good'},
      {score:5,label:'Very good / Normal'}
    ],
    questions: [
      {text:'Interest in sexual activity',desc:''},
      {text:'Ability to become aroused',desc:''},
      {text:'Ability to maintain arousal',desc:''},
      {text:'Ability to reach orgasm',desc:''},
      {text:'Satisfaction with sexual experience',desc:''}
    ],
    thresholds: [
      {max:10,label:'Significant dysfunction',color:'#e63946',badge:'badge-severe'},
      {max:17,label:'Mild dysfunction',color:'#d97706',badge:'badge-moderate'},
      {max:22,label:'Minimal concerns',color:'#10b981',badge:'badge-mild'},
      {max:25,label:'Normal function',color:'#059669',badge:'badge-minimal'}
    ],
    alertThreshold: 10,
    note:'Higher scores indicate better function (reversed scale)'
  },
  adhd: {
    name: 'ADHD Screening Questionnaire', short: 'ADHD-55', icon: '🎯',
    timeframe: 'Past 6 months', maxScore: 220,
    options: [
      {score:0,label:'Never'},
      {score:1,label:'Rarely'},
      {score:2,label:'Sometimes'},
      {score:3,label:'Often'},
      {score:4,label:'Very Often'}
    ],
    domains: [
      {name:'Inattention', items:18},
      {name:'Hyperactivity', items:18},
      {name:'Impulsivity', items:9},
      {name:'Executive Functioning', items:10}
    ],
    questions: [
      {text:'Often overlooks details in schoolwork or tasks.',domain:'Inattention'},
      {text:'Has difficulty sustaining attention during lectures or reading.',domain:'Inattention'},
      {text:'Appears not to listen when spoken to directly.',domain:'Inattention'},
      {text:'Starts tasks but quickly loses focus.',domain:'Inattention'},
      {text:'Frequently forgets daily responsibilities.',domain:'Inattention'},
      {text:'Easily distracted by surrounding noises or activity.',domain:'Inattention'},
      {text:'Difficulty organizing school or work tasks.',domain:'Inattention'},
      {text:'Avoids tasks requiring sustained mental effort.',domain:'Inattention'},
      {text:'Frequently loses items necessary for activities.',domain:'Inattention'},
      {text:'Needs repeated reminders to complete tasks.',domain:'Inattention'},
      {text:'Difficulty following multi-step instructions.',domain:'Inattention'},
      {text:'Daydreams or seems mentally absent during tasks.',domain:'Inattention'},
      {text:'Forgets appointments or planned activities.',domain:'Inattention'},
      {text:'Makes careless mistakes in work or studies.',domain:'Inattention'},
      {text:'Has trouble keeping materials organized.',domain:'Inattention'},
      {text:'Struggles to complete assignments on time.',domain:'Inattention'},
      {text:'Frequently switches from one task to another.',domain:'Inattention'},
      {text:'Difficulty maintaining attention in conversations.',domain:'Inattention'},
      {text:'Fidgets with hands, feet, or objects frequently.',domain:'Hyperactivity'},
      {text:'Leaves seat when remaining seated is expected.',domain:'Hyperactivity'},
      {text:'Moves around excessively in situations requiring calmness.',domain:'Hyperactivity'},
      {text:'Feels restless or unable to stay still for long periods.',domain:'Hyperactivity'},
      {text:'Talks more than others in group settings.',domain:'Hyperactivity'},
      {text:'Has difficulty engaging in quiet activities.',domain:'Hyperactivity'},
      {text:'Appears constantly "on the go."',domain:'Hyperactivity'},
      {text:'Frequently taps or shakes hands or legs.',domain:'Hyperactivity'},
      {text:'Gets up frequently during meetings or classes.',domain:'Hyperactivity'},
      {text:'Difficulty relaxing quietly.',domain:'Hyperactivity'},
      {text:'Moves rapidly between activities without settling.',domain:'Hyperactivity'},
      {text:'Shows excessive physical movement during conversations.',domain:'Hyperactivity'},
      {text:'Struggles to remain seated during meals or classes.',domain:'Hyperactivity'},
      {text:'Interrupts own work with unnecessary movements.',domain:'Hyperactivity'},
      {text:'Walks or runs about in inappropriate situations.',domain:'Hyperactivity'},
      {text:'Cannot sit still during long discussions or lectures.',domain:'Hyperactivity'},
      {text:'Appears impatient when required to stay inactive.',domain:'Hyperactivity'},
      {text:'Displays visible restlessness during waiting situations.',domain:'Hyperactivity'},
      {text:'Interrupts others while they are speaking.',domain:'Impulsivity'},
      {text:'Answers questions before they are completed.',domain:'Impulsivity'},
      {text:'Difficulty waiting for their turn in conversations or games.',domain:'Impulsivity'},
      {text:'Makes quick decisions without considering consequences.',domain:'Impulsivity'},
      {text:'Frequently intrudes on others\' activities.',domain:'Impulsivity'},
      {text:'Acts without thinking about possible outcomes.',domain:'Impulsivity'},
      {text:'Struggles to control sudden urges.',domain:'Impulsivity'},
      {text:'Interrupts conversations or group discussions.',domain:'Impulsivity'},
      {text:'Shows impatience when delayed or interrupted.',domain:'Impulsivity'},
      {text:'Difficulty planning tasks ahead of time.',domain:'Executive Functioning'},
      {text:'Problems prioritizing important responsibilities.',domain:'Executive Functioning'},
      {text:'Struggles to estimate how long tasks will take.',domain:'Executive Functioning'},
      {text:'Difficulty shifting between tasks effectively.',domain:'Executive Functioning'},
      {text:'Trouble remembering multiple instructions at once.',domain:'Executive Functioning'},
      {text:'Frequently procrastinates important work.',domain:'Executive Functioning'},
      {text:'Finds it hard to manage time effectively.',domain:'Executive Functioning'},
      {text:'Difficulty keeping track of long-term goals.',domain:'Executive Functioning'},
      {text:'Starts projects but struggles to complete them.',domain:'Executive Functioning'},
      {text:'Finds it difficult to maintain a structured routine.',domain:'Executive Functioning'}
    ],
    thresholds: [
      {max:50,label:'Minimal symptoms',color:'#059669',badge:'badge-minimal'},
      {max:100,label:'Mild ADHD traits',color:'#10b981',badge:'badge-mild'},
      {max:150,label:'Moderate symptoms',color:'#d97706',badge:'badge-moderate'},
      {max:220,label:'High likelihood of ADHD',color:'#dc2626',badge:'badge-severe'}
    ],
    alertThreshold: 150
  },
  autism: {
    name: 'Autism Spectrum Screening', short: 'ASS-40', icon: '🌈',
    timeframe: 'General', maxScore: 120,
    options: [
      {score:0,label:'Not true'},
      {score:1,label:'Slightly true'},
      {score:2,label:'Moderately true'},
      {score:3,label:'Very true'}
    ],
    domains: [
      {name:'Social Interaction', items:10},
      {name:'Communication', items:8},
      {name:'Restricted Interests', items:8},
      {name:'Sensory Sensitivity', items:7},
      {name:'Repetitive Behaviour', items:7}
    ],
    questions: [
      {text:'Avoids eye contact during conversations.',domain:'Social Interaction'},
      {text:'Prefers solitary activities over group play.',domain:'Social Interaction'},
      {text:'Difficulty forming close friendships.',domain:'Social Interaction'},
      {text:'Appears unaware of social cues.',domain:'Social Interaction'},
      {text:'Struggles to initiate conversations.',domain:'Social Interaction'},
      {text:'Limited interest in sharing enjoyment with others.',domain:'Social Interaction'},
      {text:'Difficulty understanding social rules.',domain:'Social Interaction'},
      {text:'Rarely seeks comfort from others.',domain:'Social Interaction'},
      {text:'Difficulty adjusting behaviour in social situations.',domain:'Social Interaction'},
      {text:'Appears socially withdrawn.',domain:'Social Interaction'},
      {text:'Difficulty maintaining back-and-forth conversation.',domain:'Communication'},
      {text:'Speaks in unusual tone or rhythm.',domain:'Communication'},
      {text:'Struggles to understand jokes or sarcasm.',domain:'Communication'},
      {text:'Uses repetitive phrases.',domain:'Communication'},
      {text:'Difficulty expressing emotions verbally.',domain:'Communication'},
      {text:'Limited use of gestures or facial expressions.',domain:'Communication'},
      {text:'Talks extensively about one topic.',domain:'Communication'},
      {text:'Difficulty interpreting others\' emotions.',domain:'Communication'},
      {text:'Strong focus on specific topics.',domain:'Restricted Interests'},
      {text:'Talks repeatedly about preferred interests.',domain:'Restricted Interests'},
      {text:'Collects or organizes objects intensely.',domain:'Restricted Interests'},
      {text:'Difficulty shifting attention from favourite activities.',domain:'Restricted Interests'},
      {text:'Shows intense interest in unusual subjects.',domain:'Restricted Interests'},
      {text:'Spends long periods engaged in one activity.',domain:'Restricted Interests'},
      {text:'Becomes upset when interrupted from favourite activity.',domain:'Restricted Interests'},
      {text:'Displays narrow range of interests.',domain:'Restricted Interests'},
      {text:'Sensitive to loud sounds.',domain:'Sensory Sensitivity'},
      {text:'Discomfort with bright lights.',domain:'Sensory Sensitivity'},
      {text:'Strong reactions to certain textures.',domain:'Sensory Sensitivity'},
      {text:'Avoids crowded or noisy places.',domain:'Sensory Sensitivity'},
      {text:'Unusual reactions to smells or tastes.',domain:'Sensory Sensitivity'},
      {text:'Covers ears in noisy environments.',domain:'Sensory Sensitivity'},
      {text:'Overwhelmed by sensory stimulation.',domain:'Sensory Sensitivity'},
      {text:'Repeats body movements such as rocking or hand flapping.',domain:'Repetitive Behaviour'},
      {text:'Repeats phrases or words frequently.',domain:'Repetitive Behaviour'},
      {text:'Insists on strict routines.',domain:'Repetitive Behaviour'},
      {text:'Becomes distressed when routines change.',domain:'Repetitive Behaviour'},
      {text:'Lines up objects repeatedly.',domain:'Repetitive Behaviour'},
      {text:'Engages in repetitive play patterns.',domain:'Repetitive Behaviour'},
      {text:'Displays ritualistic behaviours.',domain:'Repetitive Behaviour'}
    ],
    thresholds: [
      {max:30,label:'Minimal autistic traits',color:'#059669',badge:'badge-minimal'},
      {max:60,label:'Mild traits',color:'#10b981',badge:'badge-mild'},
      {max:90,label:'Moderate traits',color:'#d97706',badge:'badge-moderate'},
      {max:120,label:'High probability of ASD',color:'#dc2626',badge:'badge-severe'}
    ],
    alertThreshold: 90
  }
};

export const getSeverity = (type: string, score: number) => {
  const def = ASSESSMENTS[type];
  if (!def) return { label: 'Unknown', color: '#94a3b8', badge: 'badge-minimal' };
  const th = def.thresholds;
  for (const t of th) {
    if (score <= t.max) return t;
  }
  return th[th.length - 1];
};

export const computeDomainScores = (type: string, answers: number[]) => {
  const def = ASSESSMENTS[type];
  if (!def || !def.domains) return {};
  const result: Record<string, { score: number; max: number }> = {};
  let idx = 0;
  def.domains.forEach((d) => {
    const items = answers.slice(idx, idx + d.items);
    result[d.name] = {
      score: items.reduce((s: number, a: number) => s + (a || 0), 0),
      max: d.items * def.options[def.options.length - 1].score,
    };
    idx += d.items;
  });
  return result;
};
