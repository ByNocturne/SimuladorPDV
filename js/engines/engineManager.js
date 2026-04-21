import * as janev22 from './janev22.js';
import * as consinco from './consinco.js';
import { state } from '../state.js';

const engines = {
    janev22: janev22,
    consinco: consinco
};

export function getEngine() {
    const engineAtiva = state.engineAtiva || 'janev22';
    return engines[engineAtiva] || janev22; 
}