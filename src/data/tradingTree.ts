import type { DecisionTreeConfig } from '../types/decisionTree';

export const tradingDecisionTree: DecisionTreeConfig = {
  name: 'Trading Portal 开单检查清单 V3',
  description: '基于交易系统V3的系统化开仓前检查流程，覆盖交易前Context、趋势结构、入场执行、风控、资金管理、出场规划和交易心理',
  rootNodeId: 'trade_direction',
  nodes: {
    // ==================== 第一步：交易方向 ====================
    trade_direction: {
      id: 'trade_direction',
      question: '你计划的交易方向是什么？',
      description: '明确交易方向是所有分析的起点',
      category: '交易方向',
      options: [
        { label: '做多 (Long)', value: 'long', nextNodeId: 'pre_trade_context', icon: '📈' },
        { label: '做空 (Short)', value: 'short', nextNodeId: 'pre_trade_context', icon: '📉' },
      ],
    },

    // ==================== 第二步：交易前检查反思要素 ====================
    pre_trade_context: {
      id: 'pre_trade_context',
      question: '你是否有现有持仓可能与本次交易产生冲突？',
      description: '检查已持仓的头寸（如期权、对冲单等）是否会影响新开仓的判断和风险敞口',
      category: '交易前检查',
      options: [
        { label: '无冲突，可以独立开仓', value: 'no_conflict', nextNodeId: 'daily_prep' },
        { label: '有相关持仓，需要评估', value: 'has_position', nextNodeId: 'context_conflict' },
      ],
    },
    context_conflict: {
      id: 'context_conflict',
      question: '现有持仓的冲突是否在可控范围内？',
      description: '评估已有头寸与新交易的方向、品种、风险敞口是否叠加或对冲',
      category: '交易前检查',
      options: [
        { label: '风险可控，不影响新开仓', value: 'acceptable', nextNodeId: 'daily_prep' },
        { label: '风险敞口叠加过大，不宜开仓', value: 'too_risky', nextNodeId: 'result_no_go_context' },
      ],
    },
    daily_prep: {
      id: 'daily_prep',
      question: '今日的盘前分析是否已完成？',
      description: '包括：多时间框架的趋势/结构标注、关键位标记、消息面/基本面梳理',
      category: '交易前检查',
      options: [
        { label: '已完成，思路清晰', value: 'done', nextNodeId: 'htf_trend' },
        { label: '只做了部分分析', value: 'partial', nextNodeId: 'result_caution_prep' },
        { label: '没有做盘前分析', value: 'no', nextNodeId: 'result_no_go_prep' },
      ],
    },

    // ==================== 第三步：趋势 + 结构 Profile ====================
    htf_trend: {
      id: 'htf_trend',
      question: '高时间框架 (周线/日线/4H) 的趋势是否与你的交易方向一致？',
      description: '从周线到4H逐级确认趋势方向，顺势交易胜率更高',
      category: '趋势+结构',
      options: [
        { label: '一致，顺势交易', value: 'yes', nextNodeId: 'market_structure' },
        { label: '不一致，逆势交易', value: 'no', nextNodeId: 'counter_trend_confirm' },
      ],
    },
    counter_trend_confirm: {
      id: 'counter_trend_confirm',
      question: '逆势交易需要更强的理由。是否有明确的反转信号？',
      description: '例如：HTF出现CHoCH（结构转变）、强势反转K线形态、多重背离、关键位假突破等',
      category: '趋势+结构',
      options: [
        { label: '有明确反转信号', value: 'yes', nextNodeId: 'market_structure' },
        { label: '信号不充分', value: 'no', nextNodeId: 'result_no_go_trend' },
      ],
    },
    market_structure: {
      id: 'market_structure',
      question: '市场结构是否清晰可辨？',
      description: '能否识别出BOS（结构突破）、CHoCH（趋势转变）、清晰的高低点结构？结构混乱的市场不适合交易',
      category: '趋势+结构',
      options: [
        { label: '结构清晰，BOS/CHoCH可辨', value: 'yes', nextNodeId: 'key_level' },
        { label: '结构混乱，难以判断', value: 'no', nextNodeId: 'result_no_go_structure' },
      ],
    },

    // ==================== 第四步：入场执行 Profile ====================
    key_level: {
      id: 'key_level',
      question: '价格是否在关键位附近？',
      description: '关键位包括：Order Block (OB)、Fair Value Gap (FVG)、供需区、重要支撑/阻力位',
      category: '入场执行',
      options: [
        { label: '是，价格在关键位', value: 'yes', nextNodeId: 'entry_signal' },
        { label: '接近，但需要汇合确认', value: 'maybe', nextNodeId: 'confluence_check' },
        { label: '远离关键位', value: 'no', nextNodeId: 'result_caution_level' },
      ],
    },
    confluence_check: {
      id: 'confluence_check',
      question: '是否有多重汇合因素支持入场？',
      description: '汇合因素：斐波那契回调位、均线支撑/阻力、趋势线、成交量聚集区、多时间框架共振',
      category: '入场执行',
      options: [
        { label: '有2个以上汇合因素', value: 'yes', nextNodeId: 'entry_signal' },
        { label: '汇合因素不足', value: 'no', nextNodeId: 'result_caution_level' },
      ],
    },
    entry_signal: {
      id: 'entry_signal',
      question: '在LTF（低时间框架）是否出现了明确的入场信号？',
      description: '入场触发：反转K线形态（pin bar、engulfing）、LTF结构突破(BOS)、FVG回补确认等',
      category: '入场执行',
      options: [
        { label: '信号明确，可以入场', value: 'yes', nextNodeId: 'stop_loss' },
        { label: '等待信号确认中', value: 'waiting', nextNodeId: 'result_caution_signal' },
        { label: '没有入场信号', value: 'no', nextNodeId: 'result_no_go_signal' },
      ],
    },

    // ==================== 第五步：风控管理 ====================
    stop_loss: {
      id: 'stop_loss',
      question: '止损位是否已明确？',
      description: '止损应放在使交易逻辑失效的位置：结构高/低点外侧、OB另一侧、关键位失效处',
      category: '风控管理',
      options: [
        { label: '止损位明确，逻辑清晰', value: 'yes', nextNodeId: 'risk_reward' },
        { label: '不确定放在哪里', value: 'no', nextNodeId: 'result_no_go_stoploss' },
      ],
    },
    risk_reward: {
      id: 'risk_reward',
      question: '风险回报比 (R:R) 是多少？',
      description: '目标利润与潜在亏损的比率，建议至少 2:1',
      category: '风控管理',
      options: [
        { label: '≥ 3:1（优秀）', value: '3+', nextNodeId: 'position_size' },
        { label: '2:1 - 3:1（良好）', value: '2-3', nextNodeId: 'position_size' },
        { label: '1:1 - 2:1（一般）', value: '1-2', nextNodeId: 'rr_low_confirm' },
        { label: '< 1:1（差）', value: '<1', nextNodeId: 'result_no_go_rr' },
      ],
    },
    rr_low_confirm: {
      id: 'rr_low_confirm',
      question: 'R:R 偏低。你的交易策略胜率是否足够高来弥补？',
      description: '低R:R需要高胜率才能长期盈利，确认此策略的历史胜率',
      category: '风控管理',
      options: [
        { label: '是，此策略胜率较高', value: 'yes', nextNodeId: 'position_size' },
        { label: '胜率不确定', value: 'no', nextNodeId: 'result_caution_rr' },
      ],
    },

    // ==================== 第六步：资金管理 ====================
    position_size: {
      id: 'position_size',
      question: '单笔交易风险是否控制在账户的 1-2% 以内？',
      description: '合理的仓位管理是长期生存的关键，永远不要在单笔交易上冒过大风险',
      category: '资金管理',
      options: [
        { label: '是，风险已控制', value: 'yes', nextNodeId: 'leverage_check' },
        { label: '否，风险偏大', value: 'no', nextNodeId: 'result_no_go_position' },
      ],
    },
    leverage_check: {
      id: 'leverage_check',
      question: '使用的杠杆倍数是否合理？',
      description: '高杠杆会放大亏损，确保杠杆水平与你的止损距离和风险承受能力匹配',
      category: '资金管理',
      options: [
        { label: '杠杆合理，与风险匹配', value: 'reasonable', nextNodeId: 'exit_plan' },
        { label: '杠杆偏高，但可接受', value: 'high', nextNodeId: 'result_caution_leverage' },
        { label: '杠杆过高', value: 'too_high', nextNodeId: 'result_no_go_leverage' },
      ],
    },

    // ==================== 第七步：出场规划 ====================
    exit_plan: {
      id: 'exit_plan',
      question: '出场策略是否已明确？',
      description: '在入场前就要规划好：止盈目标位、是否分批止盈、移动止损策略',
      category: '出场规划',
      options: [
        { label: '止盈目标和移动止损都已规划', value: 'clear', nextNodeId: 'news_check' },
        { label: '只设了固定止盈，未规划移动止损', value: 'partial', nextNodeId: 'news_check' },
        { label: '没有出场计划，走一步看一步', value: 'none', nextNodeId: 'result_caution_exit' },
      ],
    },

    // ==================== 第八步：消息面/新闻检查 ====================
    news_check: {
      id: 'news_check',
      question: '近期是否有重大新闻或经济数据发布？',
      description: '重大新闻（非农、CPI、利率决议、央行讲话等）可能导致剧烈波动',
      category: '交易前检查',
      options: [
        { label: '无重大新闻', value: 'clear', nextNodeId: 'emotional_check' },
        { label: '有，但已评估影响', value: 'aware', nextNodeId: 'emotional_check' },
        { label: '有重大新闻，可能冲击市场', value: 'risky', nextNodeId: 'result_caution_news' },
      ],
    },

    // ==================== 第九步：交易心理 ====================
    emotional_check: {
      id: 'emotional_check',
      question: '你目前的交易心态如何？',
      description: '情绪化交易是亏损的主要原因之一，诚实评估自己的心理状态',
      category: '交易心理',
      options: [
        { label: '冷静理性，严格按计划执行', value: 'calm', nextNodeId: 'final_confirm' },
        { label: '有点急躁/FOMO，想快速入场', value: 'fomo', nextNodeId: 'result_caution_emotion' },
        { label: '刚经历亏损，想回本', value: 'revenge', nextNodeId: 'result_no_go_emotion' },
        { label: '过度自信，觉得不会错', value: 'overconfident', nextNodeId: 'result_caution_overconfident' },
      ],
    },

    // ==================== 第十步：最终确认 ====================
    final_confirm: {
      id: 'final_confirm',
      question: '最终确认：这笔交易是否完全符合你的交易系统？',
      description: '回顾所有检查项：Context、趋势结构、入场执行、风控、资金管理、出场规划、心理状态',
      category: '最终确认',
      options: [
        { label: '完全符合交易系统', value: 'yes', nextNodeId: 'result_go' },
        { label: '有些偏差，但可接受', value: 'partial', nextNodeId: 'result_caution_plan' },
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
      message: '所有检查项均已通过，这笔交易完全符合你的交易系统V3。严格执行计划，不要中途修改止损和止盈。',
      suggestions: [
        '按计划设置好止损和止盈，设完不再修改',
        '记录入场理由、截图，用于后续复盘',
        '到达止损或止盈前不要手动平仓',
        '设置价格提醒而不是盯盘',
        '如有分批止盈计划，提前设好挂单',
      ],
    },

    // ==================== CAUTION 结果 ====================
    result_caution_prep: {
      id: 'result_caution_prep',
      type: 'caution',
      title: '⚠️ 谨慎 - 盘前分析不完整',
      message: '只完成了部分盘前分析，可能遗漏关键信息。',
      suggestions: [
        '补充完成多时间框架分析和关键位标注',
        '检查今日消息面和经济日历',
        '分析完成后再重新评估这笔交易',
      ],
    },
    result_caution_level: {
      id: 'result_caution_level',
      type: 'caution',
      title: '⚠️ 谨慎 - 入场位置不佳',
      message: '价格不在理想的关键位（OB/FVG/S&R）附近，入场风险较高。',
      suggestions: [
        '等待价格回调到关键位再入场',
        '使用限价单在关键位挂单',
        '如果决定入场，缩小仓位控制风险',
      ],
    },
    result_caution_signal: {
      id: 'result_caution_signal',
      type: 'caution',
      title: '⚠️ 谨慎 - 等待入场确认',
      message: '高时间框架条件满足，但LTF入场信号尚未出现。',
      suggestions: [
        '设置价格提醒，等LTF出现BOS或反转K线',
        '不要急于入场，让市场来确认你的分析',
        '在等待期间不要改变原始分析',
      ],
    },
    result_caution_rr: {
      id: 'result_caution_rr',
      type: 'caution',
      title: '⚠️ 谨慎 - 风险回报比偏低',
      message: 'R:R不够理想，长期执行可能不利。',
      suggestions: [
        '寻找更精确的入场点以提高R:R',
        '考虑调整止盈目标到下一个关键位',
        '如果入场，缩小仓位来控制风险',
      ],
    },
    result_caution_leverage: {
      id: 'result_caution_leverage',
      type: 'caution',
      title: '⚠️ 谨慎 - 杠杆偏高',
      message: '杠杆倍数较高，波动可能超出承受范围。',
      suggestions: [
        '降低杠杆或缩小仓位',
        '确保止损距离与杠杆匹配',
        '高杠杆下更要严格执行止损',
      ],
    },
    result_caution_exit: {
      id: 'result_caution_exit',
      type: 'caution',
      title: '⚠️ 谨慎 - 缺少出场计划',
      message: '没有明确的出场策略会导致利润回吐或亏损扩大。',
      suggestions: [
        '在入场前明确止盈目标位',
        '制定移动止损策略（如跟踪BOS保护利润）',
        '考虑分批止盈的方案',
      ],
    },
    result_caution_news: {
      id: 'result_caution_news',
      type: 'caution',
      title: '⚠️ 谨慎 - 新闻风险',
      message: '重大新闻可能导致市场剧烈波动，技术分析可能暂时失效。',
      suggestions: [
        '等新闻发布后再入场',
        '如果必须入场，大幅缩小仓位',
        '加宽止损以应对波动，注意滑点风险',
      ],
    },
    result_caution_emotion: {
      id: 'result_caution_emotion',
      type: 'caution',
      title: '⚠️ 谨慎 - FOMO 情绪',
      message: '你可能处于急躁状态，这容易导致冲动交易和追涨杀跌。',
      suggestions: [
        '离开屏幕休息15-30分钟',
        '重新审视交易计划，确认不是在追价',
        '如果休息后仍然觉得应该入场，再回来检查',
        '记住：市场永远有机会，不差这一笔',
      ],
    },
    result_caution_overconfident: {
      id: 'result_caution_overconfident',
      type: 'caution',
      title: '⚠️ 谨慎 - 过度自信',
      message: '连续盈利后容易放松警惕，增大仓位或忽略风控规则。',
      suggestions: [
        '重新检查仓位是否在正常范围内',
        '确认止损没有被忽略或放宽',
        '回顾交易系统规则，不要因为连胜而偏离',
        '每一笔交易都是独立事件，过去的盈利不代表本次会赢',
      ],
    },
    result_caution_plan: {
      id: 'result_caution_plan',
      type: 'caution',
      title: '⚠️ 谨慎 - 偏离交易系统',
      message: '这笔交易有些偏离你的交易系统V3，需要更谨慎地对待。',
      suggestions: [
        '明确哪些环节偏离了系统规则',
        '评估偏离是否在可接受范围内',
        '如果入场，缩小仓位来控制风险',
        '交易后务必复盘这次偏离的结果',
      ],
    },

    // ==================== NO-GO 结果 ====================
    result_no_go_context: {
      id: 'result_no_go_context',
      type: 'no-go',
      title: '🚫 不建议开单 - 持仓冲突',
      message: '现有持仓与新交易风险敞口叠加过大，开仓可能导致风险失控。',
      suggestions: [
        '先处理或减少现有持仓的风险敞口',
        '等现有头寸了结后再开新仓',
        '如果方向一致，考虑在现有仓位上加仓而非新开',
      ],
    },
    result_no_go_prep: {
      id: 'result_no_go_prep',
      type: 'no-go',
      title: '🚫 不建议开单 - 未完成盘前分析',
      message: '没有做盘前分析就交易，等于蒙眼开车。',
      suggestions: [
        '先完成多时间框架的趋势和结构分析',
        '标注好关键位（OB、FVG、S&R）',
        '检查经济日历和消息面',
        '分析完成后再回来跑这个检查清单',
      ],
    },
    result_no_go_trend: {
      id: 'result_no_go_trend',
      type: 'no-go',
      title: '🚫 不建议开单 - 趋势不支持',
      message: '在没有明确反转信号的情况下逆势交易，风险极高。',
      suggestions: [
        '等待HTF出现CHoCH（结构转变）再考虑',
        '寻找顺势交易机会',
        '在更小的时间框架内寻找顺势信号',
      ],
    },
    result_no_go_structure: {
      id: 'result_no_go_structure',
      type: 'no-go',
      title: '🚫 不建议开单 - 结构不清晰',
      message: '无法识别清晰的市场结构（BOS/CHoCH），此时入场缺乏依据。',
      suggestions: [
        '等待市场形成清晰的结构',
        '换一个走势更清晰的品种',
        '切换时间框架寻找更清晰的结构',
      ],
    },
    result_no_go_signal: {
      id: 'result_no_go_signal',
      type: 'no-go',
      title: '🚫 不建议开单 - 缺乏入场信号',
      message: '没有LTF入场信号就入场等于猜测市场方向。',
      suggestions: [
        '耐心等待LTF出现BOS或反转K线确认',
        '设置价格提醒在关键位',
        '不要追涨杀跌，让价格来找你',
      ],
    },
    result_no_go_stoploss: {
      id: 'result_no_go_stoploss',
      type: 'no-go',
      title: '🚫 不建议开单 - 止损不明确',
      message: '没有明确止损位的交易是不可控的风险敞口。',
      suggestions: [
        '先确定止损位再考虑入场',
        '止损应放在结构失效的位置（如OB另一侧、关键低/高点外）',
        '如果找不到合理的止损位，放弃这笔交易',
      ],
    },
    result_no_go_rr: {
      id: 'result_no_go_rr',
      type: 'no-go',
      title: '🚫 不建议开单 - R:R 过低',
      message: 'R:R低于1:1的交易长期来看必然亏损，不值得冒险。',
      suggestions: [
        '重新寻找更精确的入场点',
        '调整止盈目标到更远的关键位',
        '放弃这笔交易，等更好的机会',
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
        '如果无法满足风控要求，放弃或等更好的入场位',
      ],
    },
    result_no_go_leverage: {
      id: 'result_no_go_leverage',
      type: 'no-go',
      title: '🚫 不建议开单 - 杠杆过高',
      message: '过高的杠杆会使小幅波动就触发爆仓，完全不可控。',
      suggestions: [
        '降低杠杆到合理范围',
        '重新计算在低杠杆下的仓位',
        '高杠杆 ≠ 高收益，它只会放大亏损',
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
      title: '🚫 不建议开单 - 不符合交易系统',
      message: '如果你自己都不确定这笔交易是否符合系统，那就不应该入场。',
      suggestions: [
        '重新审视交易系统V3的规则',
        '等待完全符合系统的机会',
        '宁可错过也不要做错',
      ],
    },
  },
};
