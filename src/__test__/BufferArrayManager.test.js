import {
  FIELDS_NO,
  FIELDS_OVERSIZE,
  OVERSIZE_CONTAINER_CAPACITY,
  addToOversizeContainer,
  emptyOversizedContainer,
  emptyOversizedContainerIndex,
  removeFromOversizeContainer,
  popOversizedContainer,
  addToSBWithOversize,
  removeFieldFromSBWithOversize
} from '../BufferArrayManager';

const vCount = 10000;
const fCount = 5000;

const specialCases = new Int32Array(
  new SharedArrayBuffer(FIELDS_OVERSIZE * OVERSIZE_CONTAINER_CAPACITY * 4)
);
const specialCasesIndex = new Int32Array(new SharedArrayBuffer(vCount * 4));
const specialFaceCases = new Int32Array(
  new SharedArrayBuffer(FIELDS_OVERSIZE * OVERSIZE_CONTAINER_CAPACITY * 4)
);
const specialFaceCasesIndex = new Int32Array(new SharedArrayBuffer(fCount * 4));

beforeEach(() => {
  emptyOversizedContainer(specialCases);
  emptyOversizedContainerIndex(specialCasesIndex);
  emptyOversizedContainer(specialFaceCases);
  emptyOversizedContainerIndex(specialFaceCasesIndex);
});

it('adds values in correct places', () => {
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 4);
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 5);
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 6);
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 7);
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 8);
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 9);
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 10);
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 11);
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 12);
  // addToOversizeContainer(specialCases, specialCasesIndex, 2, 13);

  expect(specialCasesIndex[0]).toBe(-1);
  expect(specialCasesIndex[2]).toBe(0);

  expect(specialCases[1]).toBe(4);
  expect(specialCases[2]).toBe(5);
});

it('removes and shifts values correctly', () => {
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 4);
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 5);
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 6);
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 7);
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 8);
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 9);
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 10);
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 11);
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 12);
  removeFromOversizeContainer(specialCases, specialCasesIndex, 2, 4);

  expect(specialCases[1]).toBe(5);
  expect(specialCases[9]).toBe(-1);
});

it('pops container correctly', () => {
  // first container for padding
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 18);

  // another container
  addToOversizeContainer(specialCases, specialCasesIndex, 3, 4);
  addToOversizeContainer(specialCases, specialCasesIndex, 3, 5);
  addToOversizeContainer(specialCases, specialCasesIndex, 3, 6);
  addToOversizeContainer(specialCases, specialCasesIndex, 3, 7);

  // correct length
  expect(specialCases[FIELDS_OVERSIZE]).toBe(4);
  expect(specialCases[FIELDS_OVERSIZE + 1]).toBe(4);

  const popped = popOversizedContainer(specialCases, specialCasesIndex, 3);
  expect(popped).toBe(7);
  expect(specialCases[FIELDS_OVERSIZE]).toBe(3);
});

it('when popping the last element it destroys', () => {
  // first container for padding
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 18);

  // another container
  addToOversizeContainer(specialCases, specialCasesIndex, 3, 4);
  addToOversizeContainer(specialCases, specialCasesIndex, 3, 5);
  addToOversizeContainer(specialCases, specialCasesIndex, 3, 6);

  expect(specialCasesIndex[3]).toBe(1);

  let popped = popOversizedContainer(specialCases, specialCasesIndex, 3);
  expect(popped).toBe(6);
  expect(specialCases[FIELDS_OVERSIZE]).toBe(2);
  popped = popOversizedContainer(specialCases, specialCasesIndex, 3);
  expect(popped).toBe(5);
  expect(specialCases[FIELDS_OVERSIZE]).toBe(1);
  popped = popOversizedContainer(specialCases, specialCasesIndex, 3);
  expect(popped).toBe(4);
  expect(specialCases[FIELDS_OVERSIZE]).toBe(-1);

  // removed from index
  expect(specialCasesIndex[3]).toBe(-1);
});

it('removing the last one removes the whole thing', () => {
  // first container for padding
  addToOversizeContainer(specialCases, specialCasesIndex, 2, 18);

  // another container
  addToOversizeContainer(specialCases, specialCasesIndex, 3, 4);
  addToOversizeContainer(specialCases, specialCasesIndex, 3, 5);
  addToOversizeContainer(specialCases, specialCasesIndex, 3, 6);
  addToOversizeContainer(specialCases, specialCasesIndex, 3, 7);
  addToOversizeContainer(specialCases, specialCasesIndex, 3, 8);
  addToOversizeContainer(specialCases, specialCasesIndex, 3, 9);
  addToOversizeContainer(specialCases, specialCasesIndex, 3, 10);
  addToOversizeContainer(specialCases, specialCasesIndex, 3, 11);
  addToOversizeContainer(specialCases, specialCasesIndex, 3, 12);
  addToOversizeContainer(specialCases, specialCasesIndex, 4, 18);

  expect(specialCasesIndex[3]).toBe(1);

  removeFromOversizeContainer(specialCases, specialCasesIndex, 3, 4);
  expect(specialCases[FIELDS_OVERSIZE + 1]).toBe(5);
  // removeFromOversizeContainer(specialCases, specialCasesIndex, 3, 5);
  // expect(specialCases[FIELDS_OVERSIZE + 1]).toBe(6);
  // removeFromOversizeContainer(specialCases, specialCasesIndex, 3, 6);
  // expect(specialCases[FIELDS_OVERSIZE + 1]).toBe(-1);

  // // removed from index
  // expect(specialCasesIndex[3]).toBe(-1);
});

it('correctly adds to oversized container when regular SAB is full', () => {
  const buff = new Float32Array(1024);
  const count = FIELDS_NO + FIELDS_OVERSIZE - 2; // 2 for counters
  const parentIndex = 2;
  for (var i = 0; i < count; i++) {
    addToSBWithOversize(2, i, buff, specialCases, specialCasesIndex);
  }
  expect(buff[parentIndex * FIELDS_NO]).toBe(count);
  expect(specialCases[FIELDS_OVERSIZE * 0]).toBe(FIELDS_OVERSIZE - 1);
});

it('correctly removes and recalculates', () => {
  const buff = new Float32Array(1024);
  const count = FIELDS_NO + FIELDS_OVERSIZE - 2; // 2 for counters
  const parentIndex = 2;
  for (var i = 0; i < count; i++) {
    addToSBWithOversize(parentIndex, i, buff, specialCases, specialCasesIndex);
  }

  const removeCount = 50;
  expect(buff[parentIndex * FIELDS_NO]).toBe(count);
  expect(specialCases[FIELDS_OVERSIZE * 0]).toBe(FIELDS_OVERSIZE - 1);
  for (var i = 0; i < removeCount; i++) {
    removeFieldFromSBWithOversize(
      parentIndex,
      i,
      buff,
      specialCases,
      specialCasesIndex
    );
  }
  expect(buff[parentIndex * FIELDS_NO]).toBe(count - removeCount);
  expect(specialCases[FIELDS_OVERSIZE * 0]).toBe(
    FIELDS_OVERSIZE - 1 - removeCount
  );
  console.log(specialCases);
});

it('correctly removes entire oversized container', () => {
  const buff = new Float32Array(1024);
  const count = FIELDS_NO + FIELDS_OVERSIZE - 2; // 2 for counters
  const parentIndex = 2;
  for (var i = 0; i < count; i++) {
    addToSBWithOversize(parentIndex, i, buff, specialCases, specialCasesIndex);
  }

  const removeCount = count - 5;
  console.log(specialCasesIndex);
  expect(specialCasesIndex[parentIndex]).toBe(0);
  expect(buff[parentIndex * FIELDS_NO]).toBe(count);
  expect(specialCases[FIELDS_OVERSIZE * 0]).toBe(FIELDS_OVERSIZE - 1);
  for (var i = 0; i < removeCount; i++) {
    removeFieldFromSBWithOversize(
      parentIndex,
      i,
      buff,
      specialCases,
      specialCasesIndex
    );
  }
  expect(specialCasesIndex[parentIndex]).toBe(-1);
  expect(buff[parentIndex * FIELDS_NO]).toBe(count - removeCount);
  expect(specialCases[FIELDS_OVERSIZE * 0]).toBe(-1);
});

it('removes and inserts in the middle shifting things around', () => {
  const buff = new Float32Array(1024);
  const count = FIELDS_NO + FIELDS_OVERSIZE - 2; // 2 for counters
  const parentIndex = 0;
  for (var i = 0; i < count; i++) {
    addToSBWithOversize(parentIndex, i, buff, specialCases, specialCasesIndex);
  }

  const removeCount = 220;
  expect(specialCasesIndex[parentIndex]).toBe(0);
  expect(buff[parentIndex * FIELDS_NO]).toBe(count);
  expect(specialCases[FIELDS_OVERSIZE * 0]).toBe(FIELDS_OVERSIZE - 1);
  for (var i = 0; i < removeCount; i++) {
    removeFieldFromSBWithOversize(
      parentIndex,
      i,
      buff,
      specialCases,
      specialCasesIndex
    );
  }
  // expect(buff[parentIndex * FIELDS_NO]).toBe(count - removeCount);
  // expect(specialCases[FIELDS_OVERSIZE * 0]).toBe(
  //   FIELDS_OVERSIZE - 1 - removeCount
  // );
});
