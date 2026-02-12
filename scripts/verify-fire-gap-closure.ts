import { IncidentStorage } from "../server/storage/incident.storage";
import { db } from "../server/storage/db";

type AnyObj = Record<string, any>;

type Scenario = {
  type: string;
  incidents: AnyObj[];
  victims: AnyObj[];
  expected: Record<string, Record<string, AnyObj>>;
};

const baseIncident = {
  address: "test",
  description: null,
  causeCode: null,
  causeDetailed: null,
  objectCode: null,
  objectDetailed: null,
  locality: "cities",
  region: "г. Астана",
  city: "Астана",
  damage: 0,
  deathsTotal: 0,
  deathsChildren: 0,
  deathsDrunk: 0,
  deathsCOTotal: 0,
  deathsCOChildren: 0,
  injuredTotal: 0,
  injuredChildren: 0,
  injuredCOTotal: 0,
  injuredCOChildren: 0,
  savedPeopleTotal: 0,
  savedPeopleChildren: 0,
  savedProperty: 0,
  steppeArea: 0,
  steppeDamage: 0,
  steppePeopleTotal: 0,
  steppePeopleDead: 0,
  steppePeopleInjured: 0,
  steppeAnimalsTotal: 0,
  steppeAnimalsDead: 0,
  steppeAnimalsInjured: 0,
  steppeExtinguishedTotal: 0,
  steppeExtinguishedArea: 0,
  steppeExtinguishedDamage: 0,
  steppeGarrisonPeople: 0,
  steppeGarrisonUnits: 0,
  steppeMchsPeople: 0,
  steppeMchsUnits: 0,
  timeOfDay: null,
};

const scenarios: Scenario[] = [
  {
    type: "fire",
    incidents: [
      {
        ...baseIncident,
        id: "i-fire",
        incidentType: "fire",
        dateTime: new Date("2025-01-10T14:30:00Z"),
        locality: "city_pgt",
        damage: 100,
        deathsTotal: 1,
        deathsChildren: 1,
        deathsDrunk: 1,
        injuredTotal: 1,
        savedPeopleTotal: 2,
        savedPeopleChildren: 1,
        savedProperty: 500,
        causeCode: "3",
        causeDetailed: "3.1",
        objectCode: "14.2",
        objectDetailed: "14.2",
      },
    ],
    victims: [
      {
        id: "v-fire-dead",
        incidentId: "i-fire",
        victimType: "fire",
        status: "dead",
        gender: "male",
        ageGroup: "child",
        socialStatus: "worker",
        condition: "alcohol",
        deathCause: "smoke",
        deathPlace: "hospital",
      },
      {
        id: "v-fire-injured",
        incidentId: "i-fire",
        victimType: "fire",
        status: "injured",
        gender: "female",
        ageGroup: "adult",
      },
    ],
    expected: {
      "1-osp": {
        "1": { total: 1, urban: 1, rural: 0 },
        "2": { total: 100, urban: 100, rural: 0 },
      },
      "3-spvp": {
        "3": { fires_total: 1, damage_total: 100 },
        "3.1": { fires_total: 1, damage_total: 100 },
      },
      "4-sovp": {
        "14.2": { fires_total: 1, damage_total: 100, deaths_total: 1, injuries_total: 1 },
      },
      "5-spzs": {
        "2.1.1": { urban: 1, rural: 0 },
        "3.1.1": { urban: 1, rural: 0 },
        "5.1.3": { urban: 1, rural: 0 },
      },
    },
  },
  {
    type: "nonfire",
    incidents: [
      {
        ...baseIncident,
        id: "i-nonfire",
        incidentType: "nonfire",
        dateTime: new Date("2025-01-11T08:00:00Z"),
        locality: "rural",
        damage: 40,
        causeCode: "1",
        objectCode: "9.1",
      },
    ],
    victims: [],
    expected: {
      "1-osp": {
        "1": { total: 1, urban: 0, rural: 1 },
      },
      "2-ssg": {
        "1": { value: 1 },
      },
    },
  },
  {
    type: "steppe_fire",
    incidents: [
      {
        ...baseIncident,
        id: "i-steppe-fire",
        incidentType: "steppe_fire",
        dateTime: new Date("2025-01-12T08:00:00Z"),
        locality: "cities",
        region: "г. Астана",
        steppeArea: 25,
        steppeDamage: 300,
        steppePeopleDead: 1,
        steppePeopleInjured: 2,
        steppeAnimalsDead: 3,
        steppeAnimalsInjured: 1,
        steppeExtinguishedTotal: 1,
        steppeExtinguishedArea: 10,
        steppeExtinguishedDamage: 50,
      },
    ],
    victims: [],
    expected: {
      "1-osp": {
        "1": { total: 1, urban: 1, rural: 0 },
      },
      "6-sspz": {
        "steppe:РК": { fires_count: 1, steppe_area: 25, damage_total: 300, people_total: 3 },
        "steppe:г. Астана": { fires_count: 1, steppe_area: 25, damage_total: 300, people_total: 3 },
      },
    },
  },
  {
    type: "steppe_smolder",
    incidents: [
      {
        ...baseIncident,
        id: "i-steppe-smolder",
        incidentType: "steppe_smolder",
        dateTime: new Date("2025-01-13T08:00:00Z"),
        locality: "rural",
        region: "г. Астана",
        steppeArea: 12,
        steppeDamage: 70,
      },
    ],
    victims: [],
    expected: {
      "1-osp": {
        "1": { total: 1, urban: 0, rural: 1 },
      },
      "6-sspz": {
        "ignition:РК": { fires_count: 1, steppe_area: 12, damage_total: 70 },
        "ignition:г. Астана": { fires_count: 1, steppe_area: 12, damage_total: 70 },
      },
    },
  },
  {
    type: "co_nofire",
    incidents: [
      {
        ...baseIncident,
        id: "i-co",
        incidentType: "co_nofire",
        dateTime: new Date("2025-01-14T03:30:00Z"),
        locality: "cities",
        objectCode: "unknown-code",
        deathsCOTotal: 1,
        deathsCOChildren: 0,
        injuredCOTotal: 1,
        injuredCOChildren: 0,
      },
    ],
    victims: [
      {
        id: "v-co-dead",
        incidentId: "i-co",
        victimType: "co_poisoning",
        status: "dead",
        gender: "male",
        ageGroup: "adult",
        socialStatus: "pensioner",
        condition: "sleep",
      },
      {
        id: "v-co-inj",
        incidentId: "i-co",
        victimType: "co_poisoning",
        status: "injured",
        gender: "female",
        ageGroup: "adult",
        socialStatus: "unemployed",
        condition: "alcohol",
      },
    ],
    expected: {
      "1-osp": {
        "4": { total: 1, urban: 1, rural: 0 },
        "6": { total: 1, urban: 1, rural: 0 },
      },
      co: {
        "2.5": { killed_total: 1, injured_total: 0 },
        "3.2": { killed_total: 1, injured_total: 0 },
        "12.4": { killed_total: 0, injured_total: 1 },
        "13.1": { killed_total: 0, injured_total: 1 },
        "5.12": { killed_total: 1, injured_total: 0 },
        "15.12": { killed_total: 0, injured_total: 1 },
        "8.1": { killed_total: 1, injured_total: 0 },
        "18.1": { killed_total: 0, injured_total: 1 },
      },
    },
  },
];

function flattenRows(rows: AnyObj[]): Map<string, AnyObj> {
  const out = new Map<string, AnyObj>();
  const walk = (items: AnyObj[]) => {
    for (const row of items) {
      const key = row.id ?? row.code;
      if (key) out.set(String(key), row.values ?? { value: row.value ?? 0 });
      if (row.children) walk(row.children);
    }
  };
  walk(rows);
  return out;
}

function flattenForm6(data: AnyObj) {
  const out = new Map<string, AnyObj>();
  for (const row of data.steppeRows ?? []) out.set(`steppe:${row.label}`, row.values ?? {});
  for (const row of data.ignitionRows ?? []) out.set(`ignition:${row.label}`, row.values ?? {});
  return out;
}

async function run() {
  const storage = new IncidentStorage();
  const originalSelect = (db as any).select;
  (db as any).select = () => ({
    from: () => ({
      innerJoin: () => ({
        where: async () => [],
      }),
    }),
  });

  const failures: string[] = [];
  const lines: string[] = [];

  for (const scenario of scenarios) {
    lines.push(`## scenario: ${scenario.type}`);
    (storage as any).getReportDataset = async () => ({ incidentRows: scenario.incidents, victimRows: scenario.victims });

    for (const form of ["1-osp", "2-ssg", "3-spvp", "4-sovp", "5-spzs", "6-sspz", "co"]) {
      const expected = scenario.expected[form];
      if (!expected) continue;
      const data = await storage.getReportFormData({ orgId: "test", period: "2025-01", form });
      const actualMap = form === "6-sspz" ? flattenForm6(data) : flattenRows(data.rows ?? []);

      lines.push(`- ${form}`);
      for (const [rowId, expectedValues] of Object.entries(expected)) {
        const actual = actualMap.get(rowId) ?? {};
        const mismatches = Object.entries(expectedValues).filter(([k, v]) => Number(actual[k] ?? 0) !== Number(v));
        if (mismatches.length > 0) {
          failures.push(`${scenario.type}/${form}/${rowId}: expected ${JSON.stringify(expectedValues)} got ${JSON.stringify(actual)}`);
        }
        lines.push(`  - ${rowId}: expected=${JSON.stringify(expectedValues)} actual=${JSON.stringify(actual)}`);
      }
    }
  }

  (db as any).select = originalSelect;

  console.log(lines.join("\n"));

  if (failures.length > 0) {
    console.error("\nFAILURES:\n" + failures.join("\n"));
    process.exit(1);
  }

  console.log("\nAll checks passed");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
