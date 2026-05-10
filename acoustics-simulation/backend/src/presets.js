const presets = {
  concertHall: {
    name: "混响音乐厅",
    description: "大型音乐厅场景，高反射壁面，长混响时间",
    domain: { x: 15, y: 10, z: 8 },
    sources: [
      { position_x: 0, position_y: 0, position_z: -3.5, frequency: 440, amplitude: 1.0 }
    ],
    walls: [
      {
        vertices: JSON.stringify([
          [-7.5, -5, -4], [7.5, -5, -4], [7.5, -5, 4], [-7.5, -5, 4]
        ]),
        impedance: 1.2,
        reflection: 0.97,
        absorption: 0.03,
        is_absorber: 0
      },
      {
        vertices: JSON.stringify([
          [-7.5, 5, -4], [7.5, 5, -4], [7.5, 5, 4], [-7.5, 5, 4]
        ]),
        impedance: 1.2,
        reflection: 0.97,
        absorption: 0.03,
        is_absorber: 0
      },
      {
        vertices: JSON.stringify([
          [-7.5, -5, -4], [-7.5, 5, -4], [-7.5, 5, 4], [-7.5, -5, 4]
        ]),
        impedance: 1.5,
        reflection: 0.95,
        absorption: 0.05,
        is_absorber: 0
      },
      {
        vertices: JSON.stringify([
          [7.5, -5, -4], [7.5, 5, -4], [7.5, 5, 4], [7.5, -5, 4]
        ]),
        impedance: 1.5,
        reflection: 0.95,
        absorption: 0.05,
        is_absorber: 0
      },
      {
        vertices: JSON.stringify([
          [-7.5, -5, 4], [7.5, -5, 4], [7.5, 5, 4], [-7.5, 5, 4]
        ]),
        impedance: 0.8,
        reflection: 0.85,
        absorption: 0.15,
        is_absorber: 1
      },
      {
        vertices: JSON.stringify([
          [-7.5, -5, -4], [7.5, -5, -4], [7.5, 5, -4], [-7.5, 5, -4]
        ]),
        impedance: 1.1,
        reflection: 0.92,
        absorption: 0.08,
        is_absorber: 0
      }
    ],
    anomalies: [
      "长宽比接近临界值，可能激发少量高阶模式",
      "顶面吸音材料分布不均，可能导致能量分布不平衡"
    ]
  },
  anechoicChamber: {
    name: "全消声暗室",
    description: "完全消声环境，所有壁面为高吸音材料",
    domain: { x: 6, y: 6, z: 6 },
    sources: [
      { position_x: 0, position_y: 0, position_z: 0, frequency: 880, amplitude: 1.0 }
    ],
    walls: [
      {
        vertices: JSON.stringify([
          [-3, -3, -3], [3, -3, -3], [3, -3, 3], [-3, -3, 3]
        ]),
        impedance: 0.05,
        reflection: 0.01,
        absorption: 0.99,
        is_absorber: 1
      },
      {
        vertices: JSON.stringify([
          [-3, 3, -3], [3, 3, -3], [3, 3, 3], [-3, 3, 3]
        ]),
        impedance: 0.05,
        reflection: 0.01,
        absorption: 0.99,
        is_absorber: 1
      },
      {
        vertices: JSON.stringify([
          [-3, -3, -3], [-3, 3, -3], [-3, 3, 3], [-3, -3, 3]
        ]),
        impedance: 0.05,
        reflection: 0.01,
        absorption: 0.99,
        is_absorber: 1
      },
      {
        vertices: JSON.stringify([
          [3, -3, -3], [3, 3, -3], [3, 3, 3], [3, -3, 3]
        ]),
        impedance: 0.05,
        reflection: 0.01,
        absorption: 0.99,
        is_absorber: 1
      },
      {
        vertices: JSON.stringify([
          [-3, -3, 3], [3, -3, 3], [3, 3, 3], [-3, 3, 3]
        ]),
        impedance: 0.05,
        reflection: 0.01,
        absorption: 0.99,
        is_absorber: 1
      },
      {
        vertices: JSON.stringify([
          [-3, -3, -3], [3, -3, -3], [3, 3, -3], [-3, 3, -3]
        ]),
        impedance: 0.05,
        reflection: 0.01,
        absorption: 0.99,
        is_absorber: 1
      }
    ],
    anomalies: [
      "吸音率接近1.0，但理论上无法达到完全消声",
      "边界条件可能导致数值阻抗发散"
    ]
  },
  helmholtzArray: {
    name: "亥姆霍兹共鸣器阵列",
    description: "多个亥姆霍兹共鸣器组成的阵列，激发特定共振频率",
    domain: { x: 8, y: 4, z: 4 },
    sources: [
      { position_x: -3, position_y: 0, position_z: 0, frequency: 120, amplitude: 1.0 }
    ],
    walls: [
      {
        vertices: JSON.stringify([
          [-4, -2, -2], [4, -2, -2], [4, -2, 2], [-4, -2, 2]
        ]),
        impedance: 1.0,
        reflection: 0.98,
        absorption: 0.02,
        is_absorber: 0
      },
      {
        vertices: JSON.stringify([
          [-4, 2, -2], [4, 2, -2], [4, 2, 2], [-4, 2, 2]
        ]),
        impedance: 1.0,
        reflection: 0.98,
        absorption: 0.02,
        is_absorber: 0
      },
      {
        vertices: JSON.stringify([
          [-4, -2, -2], [-4, 2, -2], [-4, 2, 2], [-4, -2, 2]
        ]),
        impedance: 1.0,
        reflection: 0.98,
        absorption: 0.02,
        is_absorber: 0
      },
      {
        vertices: JSON.stringify([
          [4, -2, -2], [4, 2, -2], [4, 2, 2], [4, -2, 2]
        ]),
        impedance: 1.0,
        reflection: 0.98,
        absorption: 0.02,
        is_absorber: 0
      },
      {
        vertices: JSON.stringify([
          [-4, -2, 2], [4, -2, 2], [4, 2, 2], [-4, 2, 2]
        ]),
        impedance: 1.0,
        reflection: 0.98,
        absorption: 0.02,
        is_absorber: 0
      },
      {
        vertices: JSON.stringify([
          [-4, -2, -2], [4, -2, -2], [4, 2, -2], [-4, 2, -2]
        ]),
        impedance: 1.0,
        reflection: 0.98,
        absorption: 0.02,
        is_absorber: 0
      },
      {
        vertices: JSON.stringify([
          [-1, -0.5, -1.8], [1, -0.5, -1.8], [1, 0.5, -1.8], [-1, 0.5, -1.8]
        ]),
        impedance: 0.3,
        reflection: 0.3,
        absorption: 0.7,
        is_absorber: 1
      },
      {
        vertices: JSON.stringify([
          [-1, -0.5, 1.8], [1, -0.5, 1.8], [1, 0.5, 1.8], [-1, 0.5, 1.8]
        ]),
        impedance: 0.3,
        reflection: 0.3,
        absorption: 0.7,
        is_absorber: 1
      }
    ],
    anomalies: [
      "共鸣器窄颈处可能存在阻抗突变",
      "高频声波可能无法激发共鸣器，出现模态截断"
    ]
  },
  subwayTunnel: {
    name: "狭长地铁隧道",
    description: "极度狭长的腔体，长宽比严重失调",
    domain: { x: 30, y: 3, z: 2.5 },
    sources: [
      { position_x: -12, position_y: 0, position_z: 0, frequency: 220, amplitude: 1.0 },
      { position_x: 12, position_y: 0, position_z: 0, frequency: 330, amplitude: 0.5 }
    ],
    walls: [
      {
        vertices: JSON.stringify([
          [-15, -1.5, -1.25], [15, -1.5, -1.25], [15, -1.5, 1.25], [-15, -1.5, 1.25]
        ]),
        impedance: 2.0,
        reflection: 0.96,
        absorption: 0.04,
        is_absorber: 0
      },
      {
        vertices: JSON.stringify([
          [-15, 1.5, -1.25], [15, 1.5, -1.25], [15, 1.5, 1.25], [-15, 1.5, 1.25]
        ]),
        impedance: 2.0,
        reflection: 0.96,
        absorption: 0.04,
        is_absorber: 0
      },
      {
        vertices: JSON.stringify([
          [-15, -1.5, -1.25], [-15, 1.5, -1.25], [-15, 1.5, 1.25], [-15, -1.5, 1.25]
        ]),
        impedance: 1.0,
        reflection: 0.99,
        absorption: 0.01,
        is_absorber: 0
      },
      {
        vertices: JSON.stringify([
          [15, -1.5, -1.25], [15, 1.5, -1.25], [15, 1.5, 1.25], [15, -1.5, 1.25]
        ]),
        impedance: 1.0,
        reflection: 0.99,
        absorption: 0.01,
        is_absorber: 0
      },
      {
        vertices: JSON.stringify([
          [-15, -1.5, 1.25], [15, -1.5, 1.25], [15, 1.5, 1.25], [-15, 1.5, 1.25]
        ]),
        impedance: 1.8,
        reflection: 0.94,
        absorption: 0.06,
        is_absorber: 0
      },
      {
        vertices: JSON.stringify([
          [-15, -1.5, -1.25], [15, -1.5, -1.25], [15, 1.5, -1.25], [-15, 1.5, -1.25]
        ]),
        impedance: 1.5,
        reflection: 0.95,
        absorption: 0.05,
        is_absorber: 0
      }
    ],
    anomalies: [
      "长宽比=10:1，严重失调，将激发大量高阶寄生模式",
      "轴向模态与横向模态严重耦合",
      "长轴方向网格密度不足，高频严重混叠"
    ]
  }
};

module.exports = presets;
