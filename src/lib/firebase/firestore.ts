'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  increment,
  runTransaction,
} from 'firebase/firestore';

const countersCollection = collection(db, 'apiUsageCounters');

export async function incrementCounter(counterId: 'imageDescriber' | 'objectFinder' | 'imageQa') {
  const counterRef = doc(countersCollection, counterId);

  try {
    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists()) {
        // If the document doesn't exist, create it with a count of 1.
        transaction.set(counterRef, { count: 1 });
      } else {
        // If it exists, increment the count.
        transaction.update(counterRef, { count: increment(1) });
      }
    });
  } catch (e) {
    console.error('Transaction failed: ', e);
    // We don't throw here to avoid failing the main user-facing action.
    // Logging the error is sufficient for now.
  }
}

export async function getCounter(counterId: 'imageDescriber' | 'objectFinder' | 'imageQa'): Promise<number> {
  const counterRef = doc(countersCollection, counterId);
  try {
    const counterDoc = await getDoc(counterRef);
    if (counterDoc.exists()) {
      return counterDoc.data().count || 0;
    }
    return 0;
  } catch (e) {
    console.error('Failed to retrieve counter: ', e);
    return 0;
  }
}
