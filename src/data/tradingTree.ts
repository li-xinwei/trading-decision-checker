import type { DecisionTreeConfig } from '../types/decisionTree';

export const tradingDecisionTree: DecisionTreeConfig = {
  name: '交易开单检查清单',
  description: '在开仓前系统性地检查所有关键条件，确保每笔交易都经过严格筛选',
  rootNodeId: 'trade_direction',
  nodes: {
    // ==================== 第一步：交易方向 ====================
    trade_direction: {
      id: 'trade_direction',
      question: '你计划的交易方向是什么？',
      description: '明确交易方向是所有分析的起点',
      category: '交易方向',
      options: [
        { label: '做多 (Long)', value: 'long', nextNodeId: 'higher_tf_trend', icon: '📈' },
        { label: '做空 (Short)', value: 'short', nextNodeId: 'higher_tf_trend', icon: '📉' },
      ],
    },

    // ==================== 第二步：趋势确认 ====================
    higher_tf_trend: {
      id: 'higher_tf_trend',
      question: '高时间框架趋势是否与你的交易方向一致？',
      description: '检查日线/4小时级别的趋势方向，顺势交易胜率更高',
      category: '趋势分析',
      options: [
        { label: '是，趋势一致', value: 'yes', nextNodeId: 'market_structure' },
        { label: '否，逆势交易', value: 'no', nextNodeId: 'counter_trend_confirm' },
      ],
    },
    counter_trend_confirm: {
      id: 'counter_trend_confirm',
      question: '逆势交易需要更强的信号。你是否有充分的逆势理由？',
      description: '例如：强势反转形态、关键水平位突破、重大背离等',
      category: '趋势分析',
      options: [
        { label: '是，有强力逆势信号', value: 'yes', nextNodeId: 'market_structure' },
        { label: '否，信号不够强', value: 'no', nextNodeId: 'result_no_go_trend' },
      ],
    },

    // ==================== 第三步：市场结构 ====================
    market_structure: {
      id: 'market_structure',
      question: '当前市场结构是否清晰？',
      description: '能否清楚地识别出高点/低点、支撑/阻力位、关键结构',
      category: '市场结构',
      options: [
        { label: '是，结构清晰', value: 'yes', nextNodeId: 'key_level' },
        { label: '否，结构混乱', value: 'no', nextNodeId: 'result_no_go_structure' },
      ],
    },

    // ==================== 第四步：关键位置 ====================
    key_level: {
      id: 'key_level',
      question: '价格是否在关键支撑/阻力位或供需区附近？',
      description: '好的入场位置通常在关键水平位附近，这提供了更好的风险回报',
      category: '关键位置',
      options: [
        { label: '是，在关键位附近', value: 'yes', nextNodeId: 'entry_signal' },
        { label: '不确定', value: 'maybe', nextNodeId: 'key_level_secondary' },
        { label: '否，远离关键位', value: 'no', nextNodeId: 'result_caution_level' },
      ],
    },
    key_level_secondary: {
      id: 'key_level_secondary',
      question: '是否有其他汇合因素支持入场？',
      description: '如：斐波那契回调、均线支撑、趋势线等',
      category: '关键位置',
      options: [
        { label: '是，有其他汇合因素', value: 'yes', nextNodeId: 'entry_signal' },
        { label: '否，没有额外因素', value: 'no', nextNodeId: 'result_caution_level' },
      ],
    },

    // ==================== 第五步：入场信号 ====================
    entry_signal: {
      id: 'entry_signal',
      question: '是否有明确的入场信号/触发条件？',
      description: 'K线形态确认（如pin bar、engulfing）、指标信号、突破回测等',
      category: '入场信号',
      options: [
        { label: '是，信号明确', value: 'yes', nextNodeId: 'stop_loss' },
        { label: '还没有，等待确认', value: 'waiting', nextNodeId: 'result_caution_signal' },
        { label: '否，没有信号', value: 'no', nextNodeId: 'result_no_go_signal' },
      ],
    },

    // ==================== 第六步：止损设置 ====================
    stop_loss: {
      id: 'stop_loss',
      question: '止损位置是否已经确定？',
      description: '止损应该放在使交易逻辑失效的位置，而不是随意设置',
      category: '风险管理',
      options: [
        { label: '是，止损位明确', value: 'yes', nextNodeId: 'risk_reward' },
        { label: '否，不确定放哪里', value: 'no', nextNodeId: 'result_no_go_stoploss' },
      ],
    },

    // ==================== 第七步：风险回报 ====================
    risk_reward: {
      id: 'risk_reward',
      question: '风险回报比 (R:R) 是多少？',
      description: '目标利润与潜在亏损的比率，建议至少 2:1',
      category: '风险管理',
      options: [
        { label: '≥ 3:1 (优秀)', value: '3+', nextNodeId: 'position_size' },
        { label: '2:1 - 3:1 (良好)', value: '2-3', nextNodeId: 'position_size' },
        { label: '1:1 - 2:1 (一般)', value: '1-2', nextNodeId: 'rr_low_confirm' },
        { label: '< 1:1 (差)', value: '<1', nextNodeId: 'result_no_go_rr' },
      ],
    },
    rr_low_confirm: {
      id: 'rr_low_confirm',
      question: 'R:R 偏低。你的交易胜率是否足够高来弥补？',
      description: '低R:R需要高胜率才能长期盈利',
      category: '风险管理',
      options: [
        { label: '是，此策略胜率很高', value: 'yes', nextNodeId: 'position_size' },
        { label: '否，胜率不确定', value: 'no', nextNodeId: 'result_caution_rr' },
      ],
    },

    // ==================== 第八步：仓位管理 ====================
    position_size: {
      id: 'position_size',
      question: '单笔风险是否控制在账户的1-2%以内？',
      description: '合理的仓位管理是长期生存的关键',
      category: '仓位管理',
      options: [
        { label: '是，风险已控制', value: 'yes', nextNodeId: 'news_check' },
        { label: '否，风险偏大', value: 'no', nextNodeId: 'result_no_go_position' },
      ],
    },

    // ==================== 第九步：新闻/事件 ====================
    news_check: {
      id: 'news_check',
      question: '近期是否有重大新闻或经济数据发布？',
      description: '重大新闻可能导致剧烈波动，影响技术分析的有效性',
      category: '市场环境',
      options: [
        { label: '无重大新闻', value: 'clear', nextNodeId: 'emotional_check' },
        { label: '有，但已考虑影响', value: 'aware', nextNodeId: 'emotional_check' },
        { label: '有重大新闻，可能冲击市场', value: 'risky', nextNodeId: 'result_caution_news' },
      ],
    },

    // ==================== 第十步：情绪检查 ====================
    emotional_check: {
      id: 'emotional_check',
      question: '你现在的交易心态如何？',
      description: '情绪化交易是亏损的主要原因之一',
      category: '心理状态',
      options: [
        { label: '冷静理性，按计划执行', value: 'calm', nextNodeId: 'final_confirm' },
        { label: '有点急躁，想快速入场', value: 'fomo', nextNodeId: 'result_caution_emotion' },
        { label: '刚经历亏损，想回本', value: 'revenge', nextNodeId: 'result_no_go_emotion' },
      ],
    },

    // ==================== 最终确认 ====================
    final_confirm: {
      id: 'final_confirm',
      question: '最终确认：这笔交易是否完全符合你的交易计划？',
      description: '回顾所有检查项，确认这是一笔计划内的交易',
      category: '最终确认',
      options: [
        { label: '是，完全符合计划', value: 'yes', nextNodeId: 'result_go' },
        { label: '有些偏差，但可以接受', value: 'partial', nextNodeId: 'result_caution_plan' },
        { label: '不确定', value: 'no', nextNodeId: 'result_no_go_plan' },
      ],
    },
  },

  results: {
    // ==================== GO 结果 ====================
    result_go: {
      id: 'result_go',
      type: 'go',
      title: '✅ 可以开单！',
      message: '所有检查项均已通过，这笔交易符合你的交易系统。严格执行计划，不要中途修改止损和止盈。',
      suggestions: [
        '设置好止损和止盈后不要频繁查看',
        '记录入场理由，用于后续复盘',
        '到达止损或止盈前不要手动平仓',
        '设置价格提醒而不是盯盘',
      ],
    },

    // ==================== CAUTION 结果 ====================
    result_caution_level: {
      id: 'result_caution_level',
      type: 'caution',
      title: '⚠️ 谨慎 - 入场位置不佳',
      message: '价格不在理想的关键位附近，入场风险较高。',
      suggestions: [
        '等待价格回调到关键位再入场',
        '使用限价单在理想位置挂单',
        '如果决定入场，请缩小仓位',
      ],
    },
    result_caution_signal: {
      id: 'result_caution_signal',
      type: 'caution',
      title: '⚠️ 谨慎 - 等待入场确认',
      message: '条件基本满足，但还没有明确的入场触发信号。',
      suggestions: [
        '设置价格提醒，等待信号出现',
        '不要急于入场，让市场来找你',
        '在等待期间不要改变分析',
      ],
    },
    result_caution_rr: {
      id: 'result_caution_rr',
      type: 'caution',
      title: '⚠️ 谨慎 - 风险回报比偏低',
      message: 'R:R不够理想，长期执行可能不利。',
      suggestions: [
        '寻找更好的入场点以提高R:R',
        '考虑调整止盈目标',
        '如果入场，务必缩小仓位',
      ],
    },
    result_caution_news: {
      id: 'result_caution_news',
      type: 'caution',
      title: '⚠️ 谨慎 - 新闻风险',
      message: '重大新闻可能导致市场剧烈波动，技术分析可能暂时失效。',
      suggestions: [
        '等新闻发布后再入场',
        '如果必须入场，缩小仓位',
        '加宽止损以应对波动',
        '注意滑点风险',
      ],
    },
    result_caution_emotion: {
      id: 'result_caution_emotion',
      type: 'caution',
      title: '⚠️ 谨慎 - FOMO情绪',
      message: '你可能处于急躁状态，这容易导致冲动交易。',
      suggestions: [
        '离开屏幕休息15分钟',
        '重新审视交易计划',
        '如果15分钟后仍然觉得应该入场，再回来检查',
        '记住：市场永远有机会',
      ],
    },
    result_caution_plan: {
      id: 'result_caution_plan',
      type: 'caution',
      title: '⚠️ 谨慎 - 偏离交易计划',
      message: '这笔交易有些偏离你的交易计划，需要更谨慎地对待。',
      suggestions: [
        '明确哪些地方偏离了计划',
        '评估偏离是否可接受',
        '如果入场，缩小仓位来控制风险',
        '交易后务必复盘这次偏离的结果',
      ],
    },

    // ==================== NO-GO 结果 ====================
    result_no_go_trend: {
      id: 'result_no_go_trend',
      type: 'no-go',
      title: '🚫 不建议开单 - 趋势不支持',
      message: '在没有强力逆势信号的情况下逆势交易，风险极高。',
      suggestions: [
        '等待趋势反转确认',
        '寻找顺势交易机会',
        '在更小的时间框架内寻找顺势信号',
      ],
    },
    result_no_go_structure: {
      id: 'result_no_go_structure',
      type: 'no-go',
      title: '🚫 不建议开单 - 市场结构不清晰',
      message: '无法识别清晰的市场结构，此时入场如同赌博。',
      suggestions: [
        '等待市场形成清晰的结构',
        '换一个走势更清晰的品种',
        '缩小或放大时间框架寻找清晰度',
      ],
    },
    result_no_go_signal: {
      id: 'result_no_go_signal',
      type: 'no-go',
      title: '🚫 不建议开单 - 缺乏入场信号',
      message: '没有入场信号就入场等于猜测市场方向。',
      suggestions: [
        '耐心等待你的入场信号出现',
        '设置价格提醒',
        '不要追涨杀跌',
      ],
    },
    result_no_go_stoploss: {
      id: 'result_no_go_stoploss',
      type: 'no-go',
      title: '🚫 不建议开单 - 止损不明确',
      message: '没有明确止损位的交易是不可控的风险。',
      suggestions: [
        '先确定止损位再考虑入场',
        '止损应放在使交易逻辑失效的位置',
        '如果找不到合理的止损位，放弃这笔交易',
      ],
    },
    result_no_go_rr: {
      id: 'result_no_go_rr',
      type: 'no-go',
      title: '🚫 不建议开单 - 风险回报比过低',
      message: 'R:R低于1:1的交易长期来看必然亏损。',
      suggestions: [
        '重新寻找更好的入场点',
        '调整止盈目标',
        '放弃这笔交易，寻找更好的机会',
      ],
    },
    result_no_go_position: {
      id: 'result_no_go_position',
      type: 'no-go',
      title: '🚫 不建议开单 - 仓位风险过大',
      message: '单笔风险超过账户2%是危险的，连续亏损会严重损害账户。',
      suggestions: [
        '缩小仓位使风险在1-2%以内',
        '使用仓位计算器重新计算',
        '如果无法满足，考虑更小的止损或放弃',
      ],
    },
    result_no_go_emotion: {
      id: 'result_no_go_emotion',
      type: 'no-go',
      title: '🚫 不建议开单 - 报复性交易',
      message: '亏损后急于回本是最危险的交易心态。此时必须停止交易。',
      suggestions: [
        '立即关闭交易软件',
        '至少休息到明天再交易',
        '回顾并接受之前的亏损',
        '记住：保护资本比赚钱更重要',
      ],
    },
    result_no_go_plan: {
      id: 'result_no_go_plan',
      type: 'no-go',
      title: '🚫 不建议开单 - 不符合交易计划',
      message: '如果你自己都不确定是否应该入场，那就不应该入场。',
      suggestions: [
        '重新审视你的交易计划',
        '等待完全符合计划的机会',
        '宁可错过也不要做错',
      ],
    },
  },
};

