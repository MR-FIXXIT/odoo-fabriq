import * as mock from '../lib/mockServer'
export async function fetchLedger(){ mock.seedDemo(); return mock.getLedger() }