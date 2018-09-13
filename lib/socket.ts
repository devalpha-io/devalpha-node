import * as primus from 'primus'

export const createServer = (config?: any) => primus.createServer({
  transformer: 'sockjs',
  iknowhttpsisbetter: true,
  ...config
})

/* istanbul ignore next */
export const saveClient = () => {
  const server = createServer({
    port: 4449 
  })
  server.save(__dirname + '/socketClient.js', (err: any) => {
    server.destroy()
    if (err) throw err
  })
}
