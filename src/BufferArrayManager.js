// BELOW FLAT ARRAYS MANAGER
export const FIELDS_NO = 30;
export const FIELDS_OVERSIZE = 500;
export const OVERSIZE_CONTAINER_CAPACITY = 2000;

export function addToSBWithOversize(
  atIndex,
  childIndex,
  target,
  oversizeContainer,
  oversizeContainerIndex
) {
  const index = atIndex * FIELDS_NO;
  let count = target[index];
  if (count === 0) {
    count++;
    target[index] = count;
    target[index + count] = childIndex;
    return;
  }

  for (var i = 0; i < count && i < FIELDS_NO - 1; i++) {
    if (target[index + i + 1] === childIndex) {
      return;
    }
  }

  let oversize = false;
  if (count >= FIELDS_NO - 1) {
    oversize = true;
  }

  if (
    oversize &&
    !addToOversizeContainer(
      oversizeContainer,
      oversizeContainerIndex,
      atIndex,
      childIndex,
      count === FIELDS_NO - 1
    )
  ) {
    return;
  }

  count++;
  target[index] = count;
  if (!oversize) {
    target[index + count] = childIndex;
  }
}

export function removeFieldFromSBWithOversize(
  indexId,
  elementToRemove,
  sbContainer,
  oversizeContainer,
  oversizeContainerIndex
) {
  let index = indexId * FIELDS_NO;
  let count = sbContainer[index];
  let oversize = false;

  if (count === 0) {
    console.log('Cannot remove from empty element');
    return;
  }
  if (count > FIELDS_NO - 1) {
    oversize = true;
  }
  let found = false;

  if (oversize) {
    const indexOf = oversizedIncludes(
      oversizeContainer,
      oversizeContainerIndex,
      indexId,
      elementToRemove
    );
    if (indexOf !== -1) {
      removeFromOversizeContainer(
        oversizeContainer,
        oversizeContainerIndex,
        indexId,
        elementToRemove
      );
      found = true;
    }
  }

  // if not found in versized find in regular
  if (!found) {
    for (var i = 0; i < count && i < FIELDS_NO - 1; i++) {
      if (!found && sbContainer[index + i + 1] === elementToRemove) {
        found = true;
      }
      if (found) {
        // overwrite and reindexing remaining
        // if it fits in regular non-oversized storage
        if (i <= FIELDS_NO - 3) {
          // maximum allow to copy from field 19 - i + 2
          // so skip this field if i >= FIELDS_NO - 3 (17)
          sbContainer[index + i + 1] = sbContainer[index + i + 2];
        } else if (oversize) {
          // only one elements needs to be popped
          const poppedEl = popOversizedContainer(
            oversizeContainer,
            oversizeContainerIndex,
            indexId
          );
          sbContainer[index + i + 1] = poppedEl;
        } else {
          // this scenario is only valid on elements with exactly 19 elements
          if (i + 1 !== FIELDS_NO - 1) {
            console.error(
              'this looks like an error. Too many field but no oversize?'
            );
          }
        }
      }
    }
  }

  if (found && count > 0) {
    sbContainer[index] = count - 1;
  }
  if (!found) {
    console.log('Cannot remove not existing element', indexId, elementToRemove);
  }
  return;
}

export function addToOversizeContainer(
  container,
  containerIndex,
  parentIndex,
  childIndex,
  reset = false
) {
  const index = getIndexInOversized(containerIndex, parentIndex);
  if (index === -1 || reset) {
    // console.log('making new oversized for value ', childIndex);
    const newIndex = findFirstFreeZoneInOversizeContainer(container);
    // console.log('new space found', newIndex);
    containerIndex[parentIndex] = newIndex;
    container[newIndex * FIELDS_OVERSIZE] = 1; // new amount of elements at this index (-1 means unused)
    container[newIndex * FIELDS_OVERSIZE + 1] = childIndex;
    return true;
  }

  const childIndexInOversized = oversizedIncludes(
    container,
    containerIndex,
    parentIndex,
    childIndex
  );
  if (childIndexInOversized !== -1) {
    // console.log('already found', parentIndex, childIndex);
    return false;
  } else {
    let length = container[index * FIELDS_OVERSIZE];
    if (length >= FIELDS_OVERSIZE - 1) {
      console.log('END IS HERE!');
      throw new Error('Ran out of oversized container capacity');
    }
    length++;
    container[index * FIELDS_OVERSIZE] = length;
    container[index * FIELDS_OVERSIZE + length] = childIndex;
    // console.log(
    //   'setting at',
    //   index * FIELDS_OVERSIZE + length,
    //   ' value ',
    //   childIndex
    // );
    return true;
  }
}

export function emptyOversizedContainer(container) {
  for (var i = 0; i < OVERSIZE_CONTAINER_CAPACITY; i++) {
    container[i * FIELDS_OVERSIZE] = -1;
  }
}

export function emptyOversizedContainerIndex(containerIndex) {
  for (var i = 0; i < containerIndex.length; i++) {
    containerIndex[i] = -1;
  }
}

export function zeroFill(arr) {
  for (var i = 0; i < arr.length; i++) {
    arr[i] = 0;
  }
}

function getIndexInOversized(containerIndex, parentIndex) {
  if (containerIndex[parentIndex] === undefined) {
    throw new Error('Oversize container index is too small');
  }
  return containerIndex[parentIndex];
}

function findFirstFreeZoneInOversizeContainer(oversizeContainer) {
  for (var i = 0; i < OVERSIZE_CONTAINER_CAPACITY; i++) {
    if (oversizeContainer[i * FIELDS_OVERSIZE] === -1) {
      return i;
    }
  }
  throw new Error('Ran out of space for oversized elements');
}
export function removeFromOversizeContainer(
  oversizeContainer,
  oversizeContainerIndex,
  parentIndex,
  childIndex
) {
  const indexInOversized = getIndexInOversized(
    oversizeContainerIndex,
    parentIndex
  );
  const offset = indexInOversized * FIELDS_OVERSIZE;
  let length = oversizeContainer[offset];
  const childIndexInOversized = oversizedIncludes(
    oversizeContainer,
    oversizeContainerIndex,
    parentIndex,
    childIndex
  );
  if (childIndexInOversized === -1) {
    throw new Error('Element is not present in oversized container');
  }

  // console.log('removing', oversizeContainer[offset + childIndexInOversized]);

  // shift the remaining
  const start = offset + childIndexInOversized;
  const end = offset + length;
  for (var i = start; i < end; i++) {
    oversizeContainer[i] = oversizeContainer[i + 1];
  }
  // set rightmost element to -1
  oversizeContainer[end] = -1;

  length--;
  oversizeContainer[offset] = length; // update length

  // if this is the last element delete the whole thing
  if (length === 0) {
    removeOversizedContainer(
      oversizeContainer,
      oversizeContainerIndex,
      parentIndex
    );
    return;
  }
}

function oversizedIncludes(container, containerIndex, parentIndex, childIndex) {
  const index = getIndexInOversized(containerIndex, parentIndex);
  const offset = index * FIELDS_OVERSIZE;
  const length = container[offset];
  //     if (length < 1) {
  //       throw new Error('empty value should be -1');
  //     }
  // console.log('checking if includes', parentIndex, childIndex, length);
  for (var i = 0; i <= length; i++) {
    if (container[offset + i] === childIndex) {
      // console.log('found at', index + i);
      return i;
    }
  }
  return -1;
}

export function removeOversizedContainer(
  oversizeContainer,
  oversizeContainerIndex,
  index
) {
  const indexInOversized = oversizeContainerIndex[index];
  const offset = indexInOversized * FIELDS_OVERSIZE;
  const length = oversizeContainer[offset];
  if (length > 0) {
    console.log('removing non empty oversized container', length);
  }
  oversizeContainer[offset] = -1;
  oversizeContainerIndex[index] = -1;
}

export function popOversizedContainer(
  oversizeContainer,
  oversizeContainerIndex,
  index
) {
  const indexInOversized = getIndexInOversized(oversizeContainerIndex, index);
  const offset = indexInOversized * FIELDS_OVERSIZE;
  let length = oversizeContainer[offset];
  const poppedElement = oversizeContainer[offset + length];

  oversizeContainer[offset + length] = -1; // clear popped element
  length--;
  oversizeContainer[offset] = length; // update length
  if (length === 0) {
    // if reducing from 1 this is last element
    removeOversizedContainer(oversizeContainer, oversizeContainerIndex, index);
  }
  return poppedElement;
}
