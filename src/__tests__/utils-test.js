jest.autoMockOff();

describe('mergeSamePersonLines', () => {
  it('should merge lines with same name', () => {
    const { mergeSamePersonLines } = require('../utils');
    expect(mergeSamePersonLines([
      {
        name: 'A',
        amount: 10
      },
      {
        name: 'A',
        amount: 20
      },
      {
        name: 'B',
        amount: 5
      }
    ])).toEqual([
      {
        name: 'A',
        amount: 30
      },
      {
        name: 'B',
        amount: 5
      }
    ]);
  });
});

describe('addSharedCost', () => {
  it('should add shared cost evenly into lines', () => {
    const { addSharedCost } = require('../utils');
    expect(addSharedCost([
      {
        name: 'A',
        amount: 10
      },
      {
        name: 'B',
        amount: 20
      },
      {
        name: 'C',
        amount: 30
      },
      {
        name: 'D',
        amount: 40
      }
    ], 100)).toEqual([
      {
        name: 'A',
        amount: 10,
        shared: 25,
        total: 35
      },
      {
        name: 'B',
        amount: 20,
        shared: 25,
        total: 45
      },
      {
        name: 'C',
        amount: 30,
        shared: 25,
        total: 55
      },
      {
        name: 'D',
        amount: 40,
        shared: 25,
        total: 65
      }
    ]);
  });
});

