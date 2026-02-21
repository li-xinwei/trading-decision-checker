import type { DecisionTreeConfig } from '../types/decisionTree';

export const tradingDecisionTree: DecisionTreeConfig = {
  name: 'Trading System V3',
  description: '基于交易系统V3的Setup筛选决策树，选择Setup后逐级Filter',
  rootNodeId: 'choose_setup',
  nodes: {
    // ==================== 选择Setup ====================
    choose_setup: {
      id: 'choose_setup',
      question: '选择这笔交易的Setup类型',
      description: '根据当前市场状态，选择最匹配的入场Setup',
      category: 'Setup选择',
      options: [
        { label: '回调setup', value: 'pullback', nextNodeId: 'pb_trend', icon: '🔄' },
        { label: '20均线缺口setup', value: 'ma20gap', nextNodeId: 'ma20_confirm', icon: '📊' },
        { label: '结构+磁体反转setup', value: 'struct_reversal', nextNodeId: 'sr_pattern', icon: '🔀' },
        { label: 'MTR反转setup', value: 'mtr', nextNodeId: 'mtr_conditions', icon: '↩️' },
        { label: '突破setup', value: 'breakout', nextNodeId: 'bo_type', icon: '💥' },
        { label: '震荡区间/通道突破', value: 'range_breakout', nextNodeId: 'rb_structure', icon: '📈' },
        { label: '区间/宽通道setup', value: 'range_fade', nextNodeId: 'rf_bg', icon: '↔️' },
      ],
    },

    // ==================== 回调setup ====================
    pb_trend: {
      id: 'pb_trend',
      question: '背景是否为明确的多头/空头趋势？',
      description: '价格是否已开始创出逆向K线，回调开始？',
      category: '回调setup',
      options: [
        { label: '是，趋势明确且回调已开始', value: 'yes', nextNodeId: 'pb_type' },
        { label: '趋势不明确', value: 'no', nextNodeId: 'result_no_go_no_trend' },
      ],
    },
    pb_type: {
      id: 'pb_type',
      question: '回调类型是什么？',
      description: '识别当前回调的形态类型',
      category: '回调setup',
      options: [
        { label: '两推回调（双顶/底）', value: 'twopush', nextNodeId: 'pb_twopush' },
        { label: '三推回调（楔形/顶底）', value: 'threepush', nextNodeId: 'pb_threepush' },
        { label: 'Trading Range回调', value: 'tr', nextNodeId: 'pb_tr' },
        { label: '50%PB + EMA20/磁体共振', value: '50pb', nextNodeId: 'pb_50' },
      ],
    },
    pb_twopush: {
      id: 'pb_twopush',
      question: '第二推是否过冲第一推极值？（排除楔形）',
      description: '两推回调要求第二推超过第一推的高/低点，如果没有过冲则可能是楔形',
      category: '回调setup',
      options: [
        { label: '是，第二推过冲了', value: 'yes', nextNodeId: 'pb_signal_k' },
        { label: '否，没有过冲', value: 'no', nextNodeId: 'result_no_go_twopush' },
      ],
    },
    pb_threepush: {
      id: 'pb_threepush',
      question: '三推楔形形态是否完整？（楔形/顶底）',
      description: '确认三推回调已经形成完整的楔形结构',
      category: '回调setup',
      options: [
        { label: '是，楔形完整', value: 'yes', nextNodeId: 'pb_signal_k' },
        { label: '还在形成中', value: 'no', nextNodeId: 'result_caution_wait' },
      ],
    },
    pb_signal_k: {
      id: 'pb_signal_k',
      question: '是否出现好的信号K？',
      description: '在回调结束位置出现反转/顺势信号K线',
      category: '回调setup',
      options: [
        { label: '是，信号K明确', value: 'yes', nextNodeId: 'pb_depth' },
        { label: '还没有，等待中', value: 'waiting', nextNodeId: 'result_caution_wait_signal' },
      ],
    },
    pb_depth: {
      id: 'pb_depth',
      question: '回调深度？',
      description: '回调幅度相对于前一段趋势的比例',
      category: '回调setup',
      options: [
        { label: '浅回调（≤ 50%）', value: 'shallow', nextNodeId: 'result_go_pb_shallow' },
        { label: '深回调（> 50%）', value: 'deep', nextNodeId: 'result_go_pb_deep' },
      ],
    },
    pb_tr: {
      id: 'pb_tr',
      question: '是否在区间上下沿出现趋势继续信号K？',
      description: '大的顺势K线创出新高1/高2/高3（或低1/低2/低3），在极值外入场',
      category: '回调setup',
      options: [
        { label: '是，出现趋势继续信号', value: 'yes', nextNodeId: 'result_go_pb_tr' },
        { label: '没有信号', value: 'no', nextNodeId: 'result_caution_wait_signal' },
      ],
    },
    pb_50: {
      id: 'pb_50',
      question: '50%PB位置是否与EMA20/重要磁体发生共振？',
      description: '回调到50%位置时，检查是否与EMA20或其他重要磁体共振',
      category: '回调setup',
      options: [
        { label: '是，存在共振', value: 'yes', nextNodeId: 'pb_50_signal' },
        { label: '没有共振', value: 'no', nextNodeId: 'result_no_go_no_confluence' },
      ],
    },
    pb_50_signal: {
      id: 'pb_50_signal',
      question: '是否出现优秀顺势信号 + 趋势K？',
      description: '在共振位置出现优秀的顺势信号K线和趋势K线',
      category: '回调setup',
      options: [
        { label: '是，信号明确', value: 'yes', nextNodeId: 'result_go_pb_50' },
        { label: '还没有', value: 'no', nextNodeId: 'result_caution_wait_signal' },
      ],
    },

    // ==================== 20均线缺口setup ====================
    ma20_confirm: {
      id: 'ma20_confirm',
      question: '价格乖离MA20的实际K线数量是否在20-30根？',
      description: '统计价格远离MA20的K线根数，确认缺口条件成立',
      category: '20均线缺口setup',
      options: [
        { label: '是，20-30根K线', value: 'yes', nextNodeId: 'ma20_entry' },
        { label: '不满足条件', value: 'no', nextNodeId: 'result_no_go_ma20' },
      ],
    },
    ma20_entry: {
      id: 'ma20_entry',
      question: '是否出现高1/低1入场信号？',
      description: '用突破单在高1/低1入场，做顺势交易',
      category: '20均线缺口setup',
      options: [
        { label: '是，信号出现', value: 'yes', nextNodeId: 'result_go_ma20' },
        { label: '还没有', value: 'no', nextNodeId: 'result_caution_wait_signal' },
      ],
    },

    // ==================== 结构+磁体反转setup ====================
    sr_pattern: {
      id: 'sr_pattern',
      question: '是否有明显的反转结构？',
      description: '双顶/底、楔形顶/底等明确的反转形态',
      category: '结构+磁体反转setup',
      options: [
        { label: '是，反转结构明显', value: 'yes', nextNodeId: 'sr_zone' },
        { label: '没有明显反转结构', value: 'no', nextNodeId: 'result_no_go_no_pattern' },
      ],
    },
    sr_zone: {
      id: 'sr_zone',
      question: '价格是否位于关键阻力/反转区域？',
      description: '区间边缘、等距测量位置等关键反转区域',
      category: '结构+磁体反转setup',
      options: [
        { label: '是，在关键反转区域', value: 'yes', nextNodeId: 'sr_signal' },
        { label: '不在关键区域', value: 'no', nextNodeId: 'result_no_go_no_zone' },
      ],
    },
    sr_signal: {
      id: 'sr_signal',
      question: '是否等到二次反转信号？',
      description: '等待第二次反转信号确认后入场',
      category: '结构+磁体反转setup',
      options: [
        { label: '是，二次信号确认', value: 'yes', nextNodeId: 'result_go_sr' },
        { label: '还在等待', value: 'no', nextNodeId: 'result_caution_wait_signal' },
      ],
    },

    // ==================== MTR反转setup ====================
    mtr_conditions: {
      id: 'mtr_conditions',
      question: '以下条件是否至少满足两项？',
      description: '1. 逆向压力充足（逆势方逐渐可以盈利）\n2. 趋势线被突破/放缓\n3. 高/低点失守\n4. 原趋势极值被测试',
      category: 'MTR反转setup',
      options: [
        { label: '满足两项以上', value: 'yes', nextNodeId: 'mtr_transition' },
        { label: '不满足', value: 'no', nextNodeId: 'result_no_go_mtr' },
      ],
    },
    mtr_transition: {
      id: 'mtr_transition',
      question: '趋势方是否由急速转为通道？',
      description: '趋势方由急速转为通道（创出逆极进行第二段），MTR反转可能成立',
      category: 'MTR反转setup',
      options: [
        { label: '是，已转为通道', value: 'yes', nextNodeId: 'mtr_type' },
        { label: '还未转换', value: 'no', nextNodeId: 'result_caution_mtr_wait' },
      ],
    },
    mtr_type: {
      id: 'mtr_type',
      question: 'MTR反转形态类型？',
      description: '在趋势极值处做反转交易，将反转方向作为顺势方向',
      category: 'MTR反转setup',
      options: [
        { label: '急速与通道', value: 'spike_channel', nextNodeId: 'result_go_mtr' },
        { label: '末端旗形', value: 'final_flag', nextNodeId: 'result_go_mtr' },
      ],
    },

    // ==================== 突破setup ====================
    bo_type: {
      id: 'bo_type',
      question: '突破类型？',
      description: '选择当前的突破方式',
      category: '突破setup',
      options: [
        { label: '开盘跳空高开/低开', value: 'gap', nextNodeId: 'bo_gap_resistance' },
        { label: '盘中趋势K线突破', value: 'trend_bar', nextNodeId: 'bo_trend_bar' },
      ],
    },
    bo_gap_resistance: {
      id: 'bo_gap_resistance',
      question: '顺势方向是否没有密集重要阻力？',
      description: '检查顺势方向是否有通道线、昨日高低等密集阻力',
      category: '突破setup',
      options: [
        { label: '无密集阻力', value: 'clear', nextNodeId: 'bo_gap_bar' },
        { label: '有密集阻力', value: 'blocked', nextNodeId: 'result_no_go_resistance' },
      ],
    },
    bo_gap_bar: {
      id: 'bo_gap_bar',
      question: '第一根K线的质量？',
      description: '评估开盘后第一根K线的形态',
      category: '突破setup',
      options: [
        { label: '大顺势K，上下秃头', value: 'perfect', nextNodeId: 'result_go_bo_gap' },
        { label: '大顺势K，顺势秃头但有逆势影线', value: 'good', nextNodeId: 'bo_second_bar' },
        { label: 'K线质量不佳', value: 'bad', nextNodeId: 'result_no_go_bar_quality' },
      ],
    },
    bo_second_bar: {
      id: 'bo_second_bar',
      question: '第二根K线是否也为顺势K线？',
      description: '第一根有逆势影线时，需要第二根K线确认方向',
      category: '突破setup',
      options: [
        { label: '是，第二根也是顺势K', value: 'yes', nextNodeId: 'result_go_bo_gap_confirmed' },
        { label: '否', value: 'no', nextNodeId: 'result_no_go_bar_quality' },
      ],
    },
    bo_trend_bar: {
      id: 'bo_trend_bar',
      question: '是否出现大顺势秃头K线突破？',
      description: '盘中出现大顺势K线突破关键位，K线实体大且秃头',
      category: '突破setup',
      options: [
        { label: '是，大顺势秃头K线', value: 'yes', nextNodeId: 'result_go_bo_trend' },
        { label: 'K线不够强', value: 'no', nextNodeId: 'result_caution_wait_signal' },
      ],
    },

    // ==================== 震荡区间/通道突破 ====================
    rb_structure: {
      id: 'rb_structure',
      question: '是否存在明显的震荡区间或通道？',
      description: '区间有明显且平行的上下沿，或宽通道有明显的通道线和趋势线',
      category: '震荡区间/通道突破',
      options: [
        { label: '是，结构明显', value: 'yes', nextNodeId: 'rb_breakout_quality' },
        { label: '结构不清晰', value: 'no', nextNodeId: 'result_no_go_no_range' },
      ],
    },
    rb_breakout_quality: {
      id: 'rb_breakout_quality',
      question: 'K线突破区间/通道边缘的方式？',
      description: '评估突破的质量和后续表现',
      category: '震荡区间/通道突破',
      options: [
        { label: '成功突破边缘，有不错的跟随', value: 'clean', nextNodeId: 'result_go_rb_direct' },
        { label: '突破后回测，再次突破', value: 'retest', nextNodeId: 'result_go_rb_retest' },
        { label: '突破失败的失败（二次反向突破）', value: 'bff', nextNodeId: 'result_go_rb_bff' },
        { label: '突破不够有力', value: 'weak', nextNodeId: 'result_caution_wait_signal' },
      ],
    },

    // ==================== 区间/宽通道setup ====================
    rf_bg: {
      id: 'rf_bg',
      question: '背景是否为足够进行交易的区间/宽通道？',
      description: '确认当前处于足够宽的交易区间或宽通道中',
      category: '区间/宽通道setup',
      options: [
        { label: '是，区间/宽通道明确', value: 'yes', nextNodeId: 'rf_sub_type' },
        { label: '不是', value: 'no', nextNodeId: 'result_no_go_no_range' },
      ],
    },
    rf_sub_type: {
      id: 'rf_sub_type',
      question: '交易的是区间还是通道？',
      description: '选择当前的结构类型',
      category: '区间/宽通道setup',
      options: [
        { label: '区间（水平震荡）', value: 'range', nextNodeId: 'rf_range_confirm' },
        { label: '宽通道（倾斜）', value: 'channel', nextNodeId: 'rf_channel_confirm' },
      ],
    },
    rf_range_confirm: {
      id: 'rf_range_confirm',
      question: '区间的ABCD点是否均遇到突破失败确认？',
      description: '通道上下沿分别遇到两次确认',
      category: '区间/宽通道setup',
      options: [
        { label: '是，均已确认', value: 'yes', nextNodeId: 'rf_range_edge' },
        { label: '确认不足', value: 'no', nextNodeId: 'result_caution_wait' },
      ],
    },
    rf_range_edge: {
      id: 'rf_range_edge',
      question: '测试区间边缘极值的K线表现？',
      description: '观察K线触及区间边缘时的行为',
      category: '区间/宽通道setup',
      options: [
        { label: '明显突破失败迹象（十字星/长影线）', value: 'bf', nextNodeId: 'result_go_rf_range_bf' },
        { label: '强趋势K线测试边缘', value: 'trend', nextNodeId: 'result_go_rf_range_trend' },
      ],
    },
    rf_channel_confirm: {
      id: 'rf_channel_confirm',
      question: '通道上下沿是否分别遇到两次确认？',
      description: '确认通道的有效性',
      category: '区间/宽通道setup',
      options: [
        { label: '是，两次确认', value: 'yes', nextNodeId: 'rf_channel_edge' },
        { label: '确认不足', value: 'no', nextNodeId: 'result_caution_wait' },
      ],
    },
    rf_channel_edge: {
      id: 'rf_channel_edge',
      question: '测试通道边缘极值的K线表现？',
      description: '观察K线触及通道边缘时的行为',
      category: '区间/宽通道setup',
      options: [
        { label: '明显突破失败迹象（十字星/长影线）', value: 'bf', nextNodeId: 'result_go_rf_channel' },
        { label: '测试后续出现反向大趋势K线', value: 'reversal', nextNodeId: 'result_go_rf_channel' },
        { label: '无明显反转迹象', value: 'none', nextNodeId: 'result_caution_wait_signal' },
      ],
    },
  },

  results: {
    // ==================== GO 结果 ====================

    // 回调 GO
    result_go_pb_shallow: {
      id: 'result_go_pb_shallow',
      type: 'go',
      title: '✅ 回调setup - 浅回调入场',
      message: '浅回调（≤50%），用突破单顺势入场。',
      suggestions: [
        '止损：趋势起点',
        '止盈：趋势极值',
        '使用突破单在信号K极值外入场',
      ],
    },
    result_go_pb_deep: {
      id: 'result_go_pb_deep',
      type: 'go',
      title: '✅ 回调setup - 深回调入场',
      message: '深回调（>50%），风险回报调整，用突破单入场。',
      suggestions: [
        '止损：回调极值外',
        '止盈：1RR / 2RR',
        '深回调风险较大，注意仓位控制',
      ],
    },
    result_go_pb_tr: {
      id: 'result_go_pb_tr',
      type: 'go',
      title: '✅ 回调setup - Trading Range回调入场',
      message: '在区间上下沿出现趋势继续信号K，极值外入场。',
      suggestions: [
        '止损：趋势起点',
        '止盈：Trading Range等距测量',
        '在大顺势K线创出新高/低后的极值外挂突破单',
      ],
    },
    result_go_pb_50: {
      id: 'result_go_pb_50',
      type: 'go',
      title: '✅ 回调setup - 50%PB共振入场',
      message: '50%回调位与EMA20/重要磁体共振，突破单顺1入场。',
      suggestions: [
        '止损：趋势起点',
        '止盈：趋势极值',
        '共振增强了该位置的支撑/阻力效果',
      ],
    },

    // 20均线缺口 GO
    result_go_ma20: {
      id: 'result_go_ma20',
      type: 'go',
      title: '✅ 20均线缺口setup - 入场',
      message: '价格乖离MA20达20-30根K线，出现高1/低1信号，用突破单做顺势交易。',
      suggestions: [
        '止损：信号K极值外',
        '止盈：原趋势极值',
        '做顺势方向的交易',
      ],
    },

    // 结构+磁体反转 GO
    result_go_sr: {
      id: 'result_go_sr',
      type: 'go',
      title: '✅ 结构+磁体反转setup - 入场',
      message: '有明显反转结构 + 价格在关键反转区域 + 二次反转信号确认，入场。',
      suggestions: [
        '止损：反转信号K极值外',
        '止盈：中轴 / 趋势50% / EMA20 分批止盈',
        '等待二次确认后再入场，不要抢第一次信号',
      ],
    },

    // MTR反转 GO
    result_go_mtr: {
      id: 'result_go_mtr',
      type: 'go',
      title: '✅ MTR反转setup - 入场',
      message: 'MTR反转条件成立，趋势由急速转为通道，在趋势极值处做反转交易。',
      suggestions: [
        '止损：趋势极值外',
        '止盈：通道起点处 / AB=CD / 趋势线',
        '将反转方向作为新的顺势方向',
        '价格预计在通道起点和原趋势极值区间内震荡',
      ],
    },

    // 突破 GO
    result_go_bo_gap: {
      id: 'result_go_bo_gap',
      type: 'go',
      title: '✅ 突破setup - 跳空突破入场',
      message: '开盘跳空 + 无密集阻力 + 第一根大顺势秃头K线，在顺势K线收盘市价入场。',
      suggestions: [
        '止损：趋势起点外',
        '止盈：自起点K线实体等距测量',
        '第一根K线上下秃头，质量最佳',
      ],
    },
    result_go_bo_gap_confirmed: {
      id: 'result_go_bo_gap_confirmed',
      type: 'go',
      title: '✅ 突破setup - 跳空二次确认入场',
      message: '开盘跳空，第一根有逆势影线但第二根顺势K确认方向，入场。',
      suggestions: [
        '止损：趋势起点外',
        '止盈：自起点K线实体等距测量',
        '第二根K线确认了方向，可以入场',
      ],
    },
    result_go_bo_trend: {
      id: 'result_go_bo_trend',
      type: 'go',
      title: '✅ 突破setup - 趋势K线突破入场',
      message: '盘中大顺势秃头K线突破关键位，在后续顺势K线市价入场。',
      suggestions: [
        '止损：趋势起点外',
        '止盈：K线实体等距测量 / 微型缺口等距测量',
        '确认突破K线实体大且秃头',
      ],
    },

    // 震荡区间/通道突破 GO
    result_go_rb_direct: {
      id: 'result_go_rb_direct',
      type: 'go',
      title: '✅ 区间/通道突破 - 直接突破入场',
      message: 'K线成功突破区间/通道边缘并有不错的跟随，在顺势K线收盘市价入场。',
      suggestions: [
        '止损：这一腿起点外',
        '止盈：震荡区间/通道线到突破点等距测量',
      ],
    },
    result_go_rb_retest: {
      id: 'result_go_rb_retest',
      type: 'go',
      title: '✅ 区间/通道突破 - 回测后入场',
      message: '突破后回测边缘再次突破，在第二次突破的信号K极值外挂突破单入场。',
      suggestions: [
        '止损：测试点极值外',
        '止盈：震荡区间/通道线到测试点等距测量',
      ],
    },
    result_go_rb_bff: {
      id: 'result_go_rb_bff',
      type: 'go',
      title: '✅ 区间/通道突破 - 突破失败的失败入场',
      message: '突破失败后再次反向突破（BFF），二次突破动能通常更强。',
      suggestions: [
        '止损：测试点极值外',
        '止盈：区间/通道等距测量',
        'BFF信号通常可靠性较高',
      ],
    },

    // 区间/宽通道 GO
    result_go_rf_range_bf: {
      id: 'result_go_rf_range_bf',
      type: 'go',
      title: '✅ 区间setup - 突破失败做反向',
      message: '区间边缘出现突破失败迹象（十字星/长影线），在突破失败K极值外用突破单入场。',
      suggestions: [
        '止损：区间边缘极值外',
        '止盈：区间中轴',
        '做反向交易，从边缘向中轴方向',
      ],
    },
    result_go_rf_range_trend: {
      id: 'result_go_rf_range_trend',
      type: 'go',
      title: '✅ 区间setup - 强趋势K测试边缘',
      message: '强趋势K线测试区间边缘，等待H2/L2在边缘用突破单入场。',
      suggestions: [
        '止损：区间边缘极值外',
        '止盈：区间中轴',
        '等待H2/L2确认后再入场',
      ],
    },
    result_go_rf_channel: {
      id: 'result_go_rf_channel',
      type: 'go',
      title: '✅ 宽通道setup - 边缘反转入场',
      message: '通道边缘出现突破失败迹象或反向大趋势K线，在极值外用突破单入场。',
      suggestions: [
        '止损：通道边线极值外',
        '止盈：上一条腿极值',
        '在通道内做反向交易',
      ],
    },

    // ==================== CAUTION 结果 ====================
    result_caution_wait: {
      id: 'result_caution_wait',
      type: 'caution',
      title: '⚠️ 等待 - 形态未完成',
      message: '形态还在形成中，需要等待完成后再评估。',
      suggestions: [
        '设置价格提醒，等待形态完成',
        '不要提前入场猜测形态结果',
        '耐心等待，市场永远有机会',
      ],
    },
    result_caution_wait_signal: {
      id: 'result_caution_wait_signal',
      type: 'caution',
      title: '⚠️ 等待 - 信号未出现',
      message: '条件基本满足，但入场信号K还未出现，耐心等待。',
      suggestions: [
        '设置价格提醒，等待信号K出现',
        '不要急于入场，让市场来确认',
        '信号出现后再重新跑一遍检查',
      ],
    },
    result_caution_mtr_wait: {
      id: 'result_caution_mtr_wait',
      type: 'caution',
      title: '⚠️ MTR反转 - 等待转换',
      message: 'MTR条件满足但趋势还未由急速转为通道，继续观察。',
      suggestions: [
        '等待趋势方由急速转为通道',
        '观察是否创出逆极进行第二段',
        '转换完成后再评估入场',
      ],
    },

    // ==================== NO-GO 结果 ====================
    result_no_go_no_trend: {
      id: 'result_no_go_no_trend',
      type: 'no-go',
      title: '🚫 不可交易 - 无明确趋势',
      message: '回调setup需要明确的多头/空头趋势背景，当前趋势不清晰。',
      suggestions: [
        '等待趋势明确后再考虑回调setup',
        '考虑其他setup类型（如区间/通道setup）',
        '切换到更高时间框架确认趋势',
      ],
    },
    result_no_go_twopush: {
      id: 'result_no_go_twopush',
      type: 'no-go',
      title: '🚫 不可交易 - 两推不成立',
      message: '第二推未过冲第一推极值，两推回调不成立，可能是楔形。',
      suggestions: [
        '如果形成三推，考虑切换到三推回调（楔形）setup',
        '重新评估回调类型',
      ],
    },
    result_no_go_no_confluence: {
      id: 'result_no_go_no_confluence',
      type: 'no-go',
      title: '🚫 不可交易 - 50%PB无共振',
      message: '50%回调位与EMA20/磁体没有共振，支撑/阻力不够强。',
      suggestions: [
        '等待价格到达有共振的位置',
        '考虑其他回调类型入场',
      ],
    },
    result_no_go_ma20: {
      id: 'result_no_go_ma20',
      type: 'no-go',
      title: '🚫 不可交易 - 均线缺口条件不足',
      message: '价格乖离MA20的K线数量不在20-30根范围内，缺口setup不成立。',
      suggestions: [
        '等待缺口条件满足',
        '考虑其他setup类型',
      ],
    },
    result_no_go_no_pattern: {
      id: 'result_no_go_no_pattern',
      type: 'no-go',
      title: '🚫 不可交易 - 无反转结构',
      message: '没有明显的反转结构（双顶/底、楔形等），结构+磁体反转setup不成立。',
      suggestions: [
        '等待反转结构形成',
        '考虑其他setup类型',
      ],
    },
    result_no_go_no_zone: {
      id: 'result_no_go_no_zone',
      type: 'no-go',
      title: '🚫 不可交易 - 不在关键反转区域',
      message: '价格不在关键阻力/反转区域（区间边缘、等距测量位置），反转可靠性低。',
      suggestions: [
        '等待价格到达关键反转区域',
        '标记好关键区域，设置提醒',
      ],
    },
    result_no_go_mtr: {
      id: 'result_no_go_mtr',
      type: 'no-go',
      title: '🚫 不可交易 - MTR条件不足',
      message: '未满足至少两项MTR反转条件，反转可能性不高。',
      suggestions: [
        '继续观察是否有更多条件满足',
        '需要：逆向压力充足、趋势线突破、高/低点失守、极值被测试（至少两项）',
      ],
    },
    result_no_go_resistance: {
      id: 'result_no_go_resistance',
      type: 'no-go',
      title: '🚫 不可交易 - 顺势方向有密集阻力',
      message: '顺势方向有通道线、昨日高低等密集重要阻力，突破setup风险高。',
      suggestions: [
        '等待阻力被消化后再考虑',
        '考虑在阻力位做反向交易',
      ],
    },
    result_no_go_bar_quality: {
      id: 'result_no_go_bar_quality',
      type: 'no-go',
      title: '🚫 不可交易 - K线质量不佳',
      message: '突破K线质量不够，无法确认突破有效性。',
      suggestions: [
        '等待更强的突破K线出现',
        '大顺势秃头K线才值得跟随',
      ],
    },
    result_no_go_no_range: {
      id: 'result_no_go_no_range',
      type: 'no-go',
      title: '🚫 不可交易 - 无明确区间/通道',
      message: '当前没有明显的震荡区间或通道结构，此setup不适用。',
      suggestions: [
        '等待区间/通道结构形成',
        '考虑其他setup类型',
      ],
    },
  },
};
