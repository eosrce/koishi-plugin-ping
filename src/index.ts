/**
 * LICENSE MIT
 * (C) E#Index
 * https://github.com/eosrce/koishi-plugin-ping
 * 
 * Simple ping plugin implementation that relies on node-ping.
 */

import { Context, Schema, segment } from 'koishi';
import * as ping from 'ping';

export const name = 'ping';

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.i18n.define('zh', require('./locales/zh-CN'))
  ctx.i18n.define('en', require('./locales/en-US'))

  ctx.i18n.define('zh', {
    expectInput: '请输入要测试的域名或IP',
    parameterWrong: '参数格式错误，请检查输入。',
    inaccessibleTpis: '无法访问 {0}',
    errorInfo: '出现错误： {0}'
  })
  ctx.i18n.define('en', {
    expectInput: 'Please enter the domain name or IP to be tested',
    parameterWrong: 'The parameter format is wrong, please check the input.',
    errorInfo: 'Error: {0}'
  })

  ctx.command('ping <host:>', 'Ping the specified host')
    .option('count', `-c <count> Number of pings`)
    .option('wait', '-w <timeout> Timeout (in milliseconds) to wait for each reply')
    .option('6', '-6 Use IPv6 protocol')
    .option('l', '-l <size> Specify packet size (in bytes)')
    .option('i', '-i <ttl> et TTL (time to live)')
    .action(async ({ session, options }, host) => {

      if (!host) return session.text('expectInput');

      const config: ping.PingConfig = {
        timeout: options.wait ? options.wait : 5,
        retries: options.count ? options.count : 4,
        v6: !!options[6],
        packetSize: options.l ? options.l : 56,
        ttl: options.i ? options.i : undefined,
      };

      if (isNaN(config.timeout) || isNaN(config.retries) || isNaN(config.packetSize) || (config.ttl !== undefined && isNaN(config.ttl))) {
        return session.text('parameterWrong');
      }

      try {
        const res = await ping.promise.probe(host, config);

        if (!res.alive) {
          return session.text('inaccessibleTpis', [`${host}`]);
        }

        const stats = { 'avg': Number(res.avg), 'min': Number(res.min), 'max': Number(res.max), 'stddev': Number(res.stddev), 'packetLoss': Number(res.packetLoss) }

        const quote = segment('quote', (`Ping 统计信息：
    目标主机：${host}
    发送次数：${config.retries}
    超时时间：${config.timeout} ms
    协议版本：${config.v6 ? 'IPv6' : 'IPv4'}
    数据包大小：${config.packetSize} byte
    TTL：${config.ttl || '默认'}
    平均延迟：${stats.avg.toFixed(2)} ms
    最小延迟：${stats.min.toFixed(2)} ms
    最大延迟：${stats.max.toFixed(2)} ms
    标准差：${stats.stddev.toFixed(2)} ms
    丢包率：${stats.packetLoss.toFixed(2)}%`));

        // const result = {
        //   pingStatistics: '',
        //   pingHost: `${host}`,
        //   pingRetries: `${config.retries}`,
        //   pingTimeout: `${config.timeout} ms`,
        //   pingVersion: `${config.v6 ? 'IPv6' : 'IPv4'}`,
        //   pingPacketSize: `${config.packetSize} btye`,
        //   'TTL': `${config.ttl || '默认'}`,
        //   pingAvg: `${stats.avg.toFixed(2)} ms`,
        //   pingMin: `${stats.min.toFixed(2)} ms`,
        //   pingMax: `${stats.max.toFixed(2)} ms`,
        //   pingStddev: `${stats.stddev.toFixed(2)} ms`,
        //   pingPacketLoss: `${stats.packetLoss.toFixed(2)}%`
        // };

        // const pingQuote = i18n.__('pingQuote',
        //   result.host,
        //   result.retries,
        //   result.timeout,
        //   result.v6 ? 'IPv6' : 'IPv4',
        //   result.packetSize,
        //   result.ttl || '默认',
        //   result.stats.avg.toFixed(2),
        //   result.stats.min.toFixed(2),
        //   result.stats.max.toFixed(2),
        //   result.stats.stddev.toFixed(2),
        //   result.stats.packetLoss.toFixed(2)
        // );

        // 输出ping结果
        session.send(quote);
        return

      } catch (err) {
        return session.text('errorInfo', [`${err.message}`]);
      }
    });
}
