import test from 'ava'
import { Map, List } from 'immutable'
import { getCurrentTotal, getReturnsTotal, getReturnsPeriod, getMaxDrawdown } from '../lib/selectors/metrics'

test('getCurrentTotal should not break when dividing by zero', (t) => {
  const capitalHistory = List([
    Map({
      cash: 0,
      reservedCash: 0,
      commission: 0,
      timestamp: 0
    })
  ])
  const positionsHistory = List([
    Map({ timestamp: 0, instruments: Map() })
  ])

  const state = Map()
    .setIn(['capital', 'history'], capitalHistory)
    .setIn(['positions', 'history'], positionsHistory)

  const expected = 0
  const actual = getCurrentTotal(state)

  t.is(expected, actual)
})

test('getCurrentTotal should correctly calculate the total value', (t) => {
  const capitalHistory = List([
    Map({
      cash: 767,
      reservedCash: 981,
      commission: 0,
      timestamp: 0
    })
  ])
  const positionsHistory = List([
    Map({
      timestamp: 0,
      instruments: Map({
        GOOG: Map({
          quantity: 13,
          price: 101.17,
          value: 1315.21
        }),
        MSFT: Map({
          quantity: 41,
          price: 31.37,
          value: 1286.17
        })
      })
    })
  ])

  const state = Map()
    .setIn(['capital', 'history'], capitalHistory)
    .setIn(['positions', 'history'], positionsHistory)

  const expected = 4349.38
  const actual = getCurrentTotal(state)

  t.is(expected, actual)
})

test('getReturnsTotal should not break when dividing by zero', (t) => {
  const capitalHistory = List([
    Map({
      cash: 0,
      reservedCash: 0,
      commission: 0,
      timestamp: 1
    }),
    Map({
      cash: 0,
      reservedCash: 0,
      commission: 0,
      timestamp: 1
    })
  ])
  const positionsHistory = List([
    Map({
      timestamp: 0,
      instruments: Map({})
    }),
    Map({
      timestamp: 1,
      instruments: Map({})
    })
  ])

  const state = Map()
    .setIn(['capital', 'history'], capitalHistory)
    .setIn(['positions', 'history'], positionsHistory)

  const expected = 0
  const actual = getReturnsTotal(state)

  t.is(expected, actual)
})

test('getReturnsTotal should correctly calculate the total returns', (t) => {
  const capitalHistory = List([
    Map({
      cash: 767,
      reservedCash: 981,
      commission: 0,
      timestamp: 1
    }),
    Map({
      cash: 787,
      reservedCash: 991,
      commission: 0,
      timestamp: 1
    })
  ])
  const positionsHistory = List([
    Map({
      timestamp: 0,
      instruments: Map({
        GOOG: Map({
          quantity: 13,
          price: 101.17,
          value: 1315.21
        }),
        MSFT: Map({
          quantity: 41,
          price: 31.37,
          value: 1286.17
        })
      })
    }),
    Map({
      timestamp: 1,
      instruments: Map({
        GOOG: Map({
          quantity: 13,
          price: 101.17,
          value: 1415.21
        }),
        MSFT: Map({
          quantity: 41,
          price: 31.37,
          value: 1586.17
        })
      })
    })
  ])

  const state = Map()
    .setIn(['capital', 'history'], capitalHistory)
    .setIn(['positions', 'history'], positionsHistory)

  const expected = 0.09886466576845443
  const actual = getReturnsTotal(state)

  t.is(expected, actual)
})

test('getReturnsPeriod should not break when dividing by zero', (t) => {
  const capitalHistory = List([
    Map({
      cash: 0,
      reservedCash: 0,
      commission: 0,
      timestamp: 0
    }),
    Map({
      cash: 0,
      reservedCash: 0,
      commission: 0,
      timestamp: 1
    })
  ])
  const positionsHistory = List([
    Map({
      timestamp: 0,
      instruments: Map({})
    }),
    Map({
      timestamp: 1,
      instruments: Map({})
    })
  ])

  const state = Map()
    .setIn(['capital', 'history'], capitalHistory)
    .setIn(['positions', 'history'], positionsHistory)

  const expected = 0
  const actual = getReturnsPeriod(state)

  t.is(expected, actual)
})

test('getReturnsPeriod should correctly calculate the return from the previous period (day or otherwise)', (t) => {
  const capitalHistory = List([
    Map({
      cash: 777,
      reservedCash: 991,
      commission: 0,
      timestamp: 1
    }),
    Map({
      cash: 787,
      reservedCash: 1001,
      commission: 0,
      timestamp: 2
    })
  ])
  const positionsHistory = List([
    Map({
      instruments: Map({
        GOOG: Map({
          quantity: 13,
          price: 101.17,
          value: 1415.21
        }),
        MSFT: Map({
          quantity: 41,
          price: 31.37,
          value: 1386.17
        })
      }),
      timestamp: 1
    }),
    Map({
      instruments: Map({
        GOOG: Map({
          quantity: 13,
          price: 101.17,
          value: 1515.21
        }),
        MSFT: Map({
          quantity: 41,
          price: 31.37,
          value: 1486.17
        })
      }),
      timestamp: 2
    })
  ])

  const state = Map()
    .setIn(['capital', 'history'], capitalHistory)
    .setIn(['positions', 'history'], positionsHistory)

  const expected = 0.04814657568422853
  const actual = getReturnsPeriod(state)

  t.is(expected, actual)
})

test('getMaxdrawdown should correctly the maximum drawdown', (t) => {
  const capitalHistory = List([
    Map({
      cash: 777,
      reservedCash: 991,
      commission: 0,
      timestamp: 1
    }),
    Map({
      cash: 787,
      reservedCash: 1001,
      commission: 0,
      timestamp: 2
    })
  ])
  const positionsHistory = List([
    Map({
      timestamp: 1,
      instruments: Map({
        GOOG: Map({
          quantity: 13,
          price: 101.17,
          value: 1415.21
        }),
        MSFT: Map({
          quantity: 41,
          price: 31.37,
          value: 1386.17
        })
      })
    }),
    Map({
      timestamp: 2,
      instruments: Map({
        GOOG: Map({
          quantity: 13,
          price: 101.17,
          value: 515.21
        }),
        MSFT: Map({
          quantity: 41,
          price: 31.37,
          value: 486.17
        })
      })
    })
  ])

  const state = Map()
    .setIn(['capital', 'history'], capitalHistory)
    .setIn(['positions', 'history'], positionsHistory)

  const expected = 0.3895495668996669
  const actual = getMaxDrawdown(state)

  t.is(expected, actual)
})
