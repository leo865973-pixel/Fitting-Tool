export const PARTS_HIERARCHY = [
    { id: 'windshield_frame', name: '前檔外框' },
    { id: 'l_ws_frame', name: '左前檔外框' }, { id: 'windshield', name: '前檔玻璃' }, { id: 'r_ws_frame', name: '右前檔外框' },
    { id: 'l_cover', name: '左飾蓋' }, { id: 'wiper_cover', name: '雨刷飾蓋' }, { id: 'r_cover', name: '右飾蓋' },
    { id: 'l_upper_corner', name: '左上角板' }, { id: 'hood', name: '引擎蓋' }, { id: 'r_upper_corner', name: '右上角板' },
    { id: 'l_drl', name: '左日行燈' }, { id: 'logo_trim', name: 'Logo 橫式飾板' }, { id: 'r_drl', name: '右日行燈' },
    { id: 'l_door', name: '左車門' }, { id: 'l_lower_corner', name: '左下角板' }, { id: 'front_center_trim', name: '車頭正面前飾板' },
    { id: 'r_lower_corner', name: '右下角板' }, { id: 'r_door', name: '右車門' },
    { id: 'l_headlight', name: '左大燈' }, { id: 'r_headlight', name: '右大燈' },
    { id: 'l_fog_light', name: '左霧燈' }, { id: 'lower_bumper', name: '前下保桿' }, { id: 'r_fog_light', name: '右霧燈' },
    { id: 'l_fender', name: '左葉子板' }, { id: 'r_fender', name: '右葉子板' }
];

export const PART_NAME_MAP = PARTS_HIERARCHY.reduce((acc, part) => { acc[part.id] = part.name; return acc; }, {});
PART_NAME_MAP['custom_point'] = '自訂標記點';

export const ADJACENT_MAP = {
    windshield_frame: ['windshield', 'l_ws_frame', 'r_ws_frame'],
    l_ws_frame: ['windshield_frame', 'windshield', 'l_upper_corner'],
    windshield: ['windshield_frame', 'l_ws_frame', 'r_ws_frame', 'l_cover', 'wiper_cover', 'r_cover'],
    r_ws_frame: ['windshield_frame', 'windshield', 'r_upper_corner'],
    l_cover: ['windshield', 'wiper_cover', 'l_upper_corner'],
    wiper_cover: ['windshield', 'l_cover', 'r_cover', 'hood'],
    r_cover: ['windshield', 'wiper_cover', 'r_upper_corner'],
    l_upper_corner: ['l_ws_frame', 'l_cover', 'hood', 'l_drl', 'l_door'],
    hood: ['wiper_cover', 'l_upper_corner', 'r_upper_corner', 'logo_trim', 'l_drl', 'r_drl'],
    r_upper_corner: ['r_ws_frame', 'r_cover', 'hood', 'r_drl', 'r_door'],
    l_drl: ['l_upper_corner', 'hood', 'logo_trim', 'l_lower_corner', 'front_center_trim', 'l_door'],
    logo_trim: ['hood', 'l_drl', 'r_drl', 'front_center_trim'],
    r_drl: ['r_upper_corner', 'hood', 'logo_trim', 'r_lower_corner', 'front_center_trim', 'r_door'],
    l_door: ['l_upper_corner', 'l_drl', 'l_lower_corner', 'l_fender'],
    l_lower_corner: ['l_drl', 'l_door', 'front_center_trim', 'l_headlight', 'l_fender'],
    front_center_trim: ['logo_trim', 'l_drl', 'r_drl', 'l_lower_corner', 'r_lower_corner', 'l_headlight', 'l_fog_light', 'lower_bumper', 'r_fog_light', 'r_headlight'],
    r_lower_corner: ['r_drl', 'r_door', 'front_center_trim', 'r_headlight', 'r_fender'],
    r_door: ['r_upper_corner', 'r_drl', 'r_lower_corner', 'r_fender'],
    l_headlight: ['l_lower_corner', 'front_center_trim', 'l_fog_light', 'l_fender'],
    r_headlight: ['r_lower_corner', 'front_center_trim', 'r_fog_light', 'r_fender'],
    l_fog_light: ['l_headlight', 'front_center_trim', 'lower_bumper', 'l_fender'],
    lower_bumper: ['front_center_trim', 'l_fog_light', 'l_fender', 'r_fog_light', 'r_fender'],
    r_fog_light: ['r_headlight', 'front_center_trim', 'lower_bumper', 'r_fender'],
    l_fender: ['l_door', 'l_lower_corner', 'l_headlight', 'l_fog_light', 'lower_bumper'],
    r_fender: ['r_door', 'r_lower_corner', 'r_headlight', 'r_fog_light', 'lower_bumper']
};

export const PART_PATHS_2D = {
    windshield_frame: "M 155,18 L 645,18 L 628,38 L 172,38 Z",
    l_ws_frame: "M 155,18 L 172,38 L 100,200 L 60,200 Z",
    windshield: "M 172,38 L 628,38 L 700,200 L 100,200 Z",
    r_ws_frame: "M 645,18 L 628,38 L 700,200 L 740,200 Z",
    l_cover: "M 100,200 L 150,200 L 180,240 Z",
    wiper_cover: "M 150,200 L 650,200 L 620,240 L 180,240 Z",
    r_cover: "M 650,200 L 700,200 L 620,240 Z",
    l_upper_corner: "M 60,200 L 100,200 L 180,240 L 210,280 L 60,280 Z",
    hood: "M 180,240 L 620,240 L 590,280 L 210,280 Z",
    r_upper_corner: "M 700,200 L 740,200 L 740,280 L 590,280 L 620,240 Z",
    l_drl: "M 60,280 L 240,280 L 270,320 L 60,320 Z",
    logo_trim: "M 240,280 L 560,280 L 530,320 L 270,320 Z",
    r_drl: "M 560,280 L 740,280 L 740,320 L 530,320 Z",
    l_door: "M 10,200 L 60,200 L 60,620 L 10,620 Z",
    r_door: "M 740,200 L 790,200 L 790,620 L 740,620 Z",
    front_center_trim: "M 192,320 L 608,320 L 590,370 L 590,380 L 612,380 L 612,464 L 605,480 L 195,480 L 188,464 L 188,380 L 210,380 L 210,370 Z",
    lower_bumper: "M 195,480 L 605,480 L 636,560 L 670,620 L 130,620 L 164,560 Z",
    l_lower_corner: "M 60,320 L 192,320 L 210,370 L 210,380 L 100,380 L 100,389 L 60,389 Z",
    r_lower_corner: "M 740,320 L 608,320 L 590,370 L 590,380 L 700,380 L 700,389 L 740,389 Z",
    l_headlight: "M 100,380 L 188,380 L 188,464 L 100,464 Z",
    r_headlight: "M 612,380 L 700,380 L 700,464 L 612,464 Z",
    l_fog_light: "M 100,464 L 188,464 L 195,480 L 164,560 Z",
    r_fog_light: "M 612,464 L 700,464 L 636,560 L 605,480 Z",
    l_fender: "M 60,389 L 100,389 L 100,464 L 164,560 L 130,620 L 60,620 Z",
    r_fender: "M 740,389 L 700,389 L 700,464 L 636,560 L 670,620 L 740,620 Z"
};

export const PART_PATHS_LEFT = {};
export const PART_PATHS_RIGHT = {};

export const TEXT_CONFIG = {
    l_ws_frame: { rotation: -64, fontSize: 11 },
    r_ws_frame: { rotation: 64, fontSize: 11 },
    l_cover: { rotation: 26, fontSize: 11 },
    r_cover: { rotation: -26, fontSize: 11 },
    l_fender: { writingMode: 'vertical-rl', xOffset: -20, yOffset: 20, fontSize: 13 },
    r_fender: { writingMode: 'vertical-rl', xOffset: 20, yOffset: 20, fontSize: 13 },
    l_door: { writingMode: 'vertical-rl', xOffset: -5 },
    r_door: { writingMode: 'vertical-rl', xOffset: 5 },
    l_upper_corner: { xOffset: -8, yOffset: 8 },
    r_upper_corner: { xOffset: 8, yOffset: 8 },
    l_lower_corner: { xOffset: -15, yOffset: -5 },
    r_lower_corner: { xOffset: 15, yOffset: -5 },
    windshield_frame: { fontSize: 11 }
};

export const ISSUE_CATEGORIES = ['間隙過大', '間隙過小', '段差凸出', '段差下陷', '干涉/摩擦', '變形/歪斜', '刮傷/外觀不良', '組裝困難', '其他'];
