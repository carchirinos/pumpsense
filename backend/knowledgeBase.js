/**
 * PumpSense hardcoded knowledge base.
 * Each scenario maps a failure pattern to its likely cause and recommended action.
 * This context is injected into the Claude prompt so the model reasons over
 * known industrial pump failure patterns rather than general knowledge alone.
 *
 * Fields:
 *   id        - unique identifier for the scenario
 *   name      - short human-readable failure name
 *   keywords  - terms used to help the prompt signal pattern relevance to the model
 *   symptoms  - observable indicators a technician would describe
 *   cause     - root cause of the failure pattern
 *   action    - numbered steps the technician should take
 */

const knowledgeBase = [
  {
    id: 'cavitation',
    name: 'Cavitation',
    keywords: ['vibration', 'pressure', 'cavitation', 'noise', 'rattling', 'low flow', 'suction'],
    symptoms: [
      'High vibration with rattling or crackling noise',
      'Loss of pressure or reduced flow rate',
      'Pump performance drops intermittently',
      'Noise described as gravel or marbles inside the pump',
    ],
    cause:
      'Cavitation due to insufficient Net Positive Suction Head (NPSH) or air ingress on the suction side. ' +
      'Vapor bubbles form and collapse inside the impeller, causing energy loss and mechanical damage.',
    action:
      '1. Check fluid level in the supply tank — refill if low\n' +
      '2. Inspect suction line for leaks, blockages, or partially closed valves\n' +
      '3. Verify suction pipe diameter is adequate and not undersized\n' +
      '4. Reduce pump speed if operating above design point\n' +
      '5. Inspect impeller for pitting or erosion damage and replace if needed',
  },
  {
    id: 'bearing-failure',
    name: 'Bearing Failure',
    keywords: ['grinding', 'bearing', 'vibration', 'noise', 'heat', 'overheating', 'lubrication', 'seized'],
    symptoms: [
      'Loud grinding or screeching noise',
      'Heavy vibration felt on the pump casing or motor housing',
      'Elevated bearing temperature (hot to the touch)',
      'Vibration worsens progressively over time',
    ],
    cause:
      'Worn or failed bearings due to inadequate lubrication, contaminated grease/oil, ' +
      'shaft misalignment, or end-of-service-life fatigue.',
    action:
      '1. Stop the pump immediately to prevent shaft damage\n' +
      '2. Allow to cool, then inspect bearings for scoring, discoloration, or visible wear\n' +
      '3. Check lubrication — replenish or replace grease/oil if degraded or contaminated\n' +
      '4. Verify shaft alignment with a dial indicator; realign if outside tolerance\n' +
      '5. Replace damaged bearings and recheck alignment before restart',
  },
  {
    id: 'seal-leak',
    name: 'Mechanical Seal Leak',
    keywords: ['leak', 'seal', 'dripping', 'fluid', 'wet', 'seeping', 'shaft', 'gland'],
    symptoms: [
      'Visible fluid leaking from the pump body near the shaft',
      'Wet or stained area around the mechanical seal or stuffing box',
      'Dripping at the gland or seal housing',
      'Gradual loss of fluid in the system',
    ],
    cause:
      'Worn or damaged mechanical seal faces, scored shaft sleeve, or failed seal O-ring. ' +
      'Can be caused by dry running, abrasive particles in the fluid, or thermal shock.',
    action:
      '1. Isolate the pump and relieve system pressure before inspection\n' +
      '2. Inspect seal faces for scoring, chips, or wear — replace seal cartridge if damaged\n' +
      '3. Check shaft sleeve for scoring or grooves; replace sleeve if surface is compromised\n' +
      '4. Inspect O-rings and gaskets for hardening, cracking, or deformation\n' +
      '5. Verify pump was not run dry — check suction conditions before restart',
  },
  {
    id: 'impeller-damage',
    name: 'Impeller Damage',
    keywords: ['impeller', 'flow', 'noise', 'erosion', 'clog', 'debris', 'reduced output', 'efficiency'],
    symptoms: [
      'Significant loss of flow rate or discharge pressure',
      'Unusual noise (clanking or uneven sound) during operation',
      'Pump draws normal current but delivers less output than expected',
      'Sudden performance drop after pumping debris or running dry',
    ],
    cause:
      'Impeller erosion from cavitation, corrosion, or abrasive solids in the fluid. ' +
      'Physical damage from foreign objects entering the pump. Clogging with fibrous or solid material.',
    action:
      '1. Shut down and isolate the pump\n' +
      '2. Open pump casing and visually inspect impeller vanes for erosion, cracking, or missing material\n' +
      '3. Clear any debris or blockage from impeller passages\n' +
      '4. Measure impeller diameter against manufacturer spec — replace if worn beyond tolerance\n' +
      '5. Install intake strainer to prevent recurrence from debris ingestion',
  },
  {
    id: 'motor-overload',
    name: 'Motor Overload / Tripping Breaker',
    keywords: ['overload', 'breaker', 'tripping', 'current', 'amps', 'motor', 'thermal', 'restart', 'disconnect'],
    symptoms: [
      'Motor thermal overload or circuit breaker trips repeatedly',
      'High current draw measured at the motor',
      'Motor runs hot or shuts off under load',
      'Pump restarts but trips again shortly after',
    ],
    cause:
      'Excessive load on the motor due to shaft misalignment, blocked discharge line, ' +
      'fluid viscosity higher than design, impeller rubbing on casing, or motor winding fault.',
    action:
      '1. Check discharge line for closed valves or blockages and clear them\n' +
      '2. Measure motor current with a clamp meter and compare to nameplate FLA rating\n' +
      '3. Verify shaft alignment — misalignment increases mechanical load\n' +
      '4. Inspect for impeller contact with casing (rubbing indicates worn wear rings or bearing play)\n' +
      '5. Verify fluid viscosity matches pump design parameters\n' +
      '6. If current is within spec but breaker still trips, inspect overload relay setting and motor windings',
  },
  {
    id: 'air-binding',
    name: 'Air Binding',
    keywords: ['air', 'airlock', 'gurgling', 'intermittent', 'priming', 'no flow', 'sputtering', 'suction'],
    symptoms: [
      'Pump runs but delivers no flow or very intermittent flow',
      'Gurgling, sputtering, or hissing sounds from the pump',
      'Pump loses prime and requires frequent re-priming',
      'Discharge pressure fluctuates erratically',
    ],
    cause:
      'Air trapped inside the pump casing or suction line prevents the impeller from creating ' +
      'sufficient hydraulic pressure. Caused by a suction air leak, high-point air pocket in piping, ' +
      'or loss of prime due to low suction supply.',
    action:
      '1. Shut down the pump and open the priming/vent plug on top of the casing to bleed trapped air\n' +
      '2. Inspect the entire suction line for air leaks — check flanges, valves, and threaded fittings\n' +
      '3. Verify suction supply level is above the minimum required for priming\n' +
      '4. Check that foot valve (if installed) is holding prime and not leaking back\n' +
      '5. Reprime the pump and restart; if air binding recurs, reroute suction line to eliminate high-point traps',
  },
  {
    id: 'overheating',
    name: 'Overheating',
    keywords: ['hot', 'temperature', 'overheating', 'heat', 'thermal', 'cooling', 'lubrication', 'jacket'],
    symptoms: [
      'Pump casing or motor is excessively hot to the touch',
      'Bearing temperature exceeds normal operating range',
      'Thermal protection trips on motor or bearing housing',
      'Burning smell from motor or bearing area',
    ],
    cause:
      'Insufficient cooling or lubrication, operating at very low or zero flow (deadheading), ' +
      'ambient temperature too high, or loss of cooling water/jacket flow on high-temperature applications.',
    action:
      '1. Check bearing lubrication — inspect grease/oil level and condition; replenish if needed\n' +
      '2. Verify pump is not operating against a closed discharge valve (deadheading) — open discharge\n' +
      '3. Check cooling water flow rate and temperature if pump has a cooling jacket\n' +
      '4. Inspect ventilation around the motor and clear any obstructions\n' +
      '5. Verify operating point is within the pump\'s allowable flow range per the performance curve\n' +
      '6. Allow pump to cool before restart; investigate root cause before returning to service',
  },
];

export default knowledgeBase;
