import * as mock from '../lib/mockServer'
export async function fetchBOMs(){ mock.seedDemo(); return mock.getBOMs() }