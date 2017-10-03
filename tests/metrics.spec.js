import test from 'ava'
import { Map, List, is } from 'immutable'
import { getTotal, getReturnsTotal, getReturnsPeriod } from '../lib/selectors/metrics'

test('getTotal should correctly calculate the total value', (t) => {
  const state = Map({
    positions: Map({
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
    capital: Map({
      initialCash: 0,
      cash: 767,
      reservedCash: 981,
      commission: 0
    })
  })

  const expected = 4349.38
  const actual = getTotal(state)

  t.is(expected, actual)
})

test('getReturnsTotal should correctly calculate the total returns', (t) => {
  const state = Map({
    positions: Map({
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
    capital: Map({
      initialCash: 500,
      cash: 767,
      reservedCash: 981,
      commission: 0
    })
  })

  const expected = 7.69876
  const actual = getReturnsTotal(state)

  t.is(expected, actual)
})


test('getReturnsPeriod should correctly calculate the return from the previous period (day or otherwise)', (t) => {
  const state = Map({
    positions: Map({
      instruments: Map({
        GOOG: Map({
          quantity: 13,
          price: 101.17,
          value: 1615.21
        }),
        MSFT: Map({
          quantity: 41,
          price: 31.37,
          value: 1586.17
        })
      }),
      history: List([
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
    }),
    capital: Map({
      initialCash: 500,
      cash: 767,
      reservedCash: 981,
      commission: 0,
      history: List([
        Map({
          initialCash: 500,
          cash: 777,
          reservedCash: 991,
          commission: 0,
          timestamp: 1
        }),
        Map({
          initialCash: 500,
          cash: 787,
          reservedCash: 1001,
          commission: 0,
          timestamp: 2
        })
      ])
    })
  })

  // 4949.38 / 4789.38 - 1
  const expected = 0.03340724686702663
  const actual = getReturnsPeriod(state)

  t.is(expected, actual)
})
