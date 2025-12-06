// 预设场景词库（双语格式：english 汉字）
const PRESET_VOCABULARY = {
    "超市": {
        "核心": [
            "cashier 收银员",
            "shelf 货架",
            "shopping cart 购物车",
            "checkout counter 收银台"
        ],
        "物品": [
            "apple 苹果",
            "milk 牛奶",
            "bread 面包",
            "egg 鸡蛋",
            "vegetable 蔬菜",
            "fruit 水果",
            "drink 饮料",
            "snack 零食"
        ],
        "环境": [
            "exit 出口",
            "entrance 入口",
            "light 灯",
            "sign 指示牌",
            "price tag 价格标签"
        ]
    },
    "医院": {
        "核心": [
            "doctor 医生",
            "nurse 护士",
            "patient 病人",
            "registration desk 挂号处"
        ],
        "物品": [
            "stethoscope 听诊器",
            "thermometer 体温计",
            "syringe 针筒",
            "medicine 药",
            "bandage 绷带",
            "wheelchair 轮椅"
        ],
        "环境": [
            "clinic room 诊室",
            "waiting area 等候区",
            "registration card 挂号牌",
            "emergency exit 紧急出口"
        ]
    },
    "公园": {
        "核心": [
            "swing 秋千",
            "slide 滑梯",
            "seesaw 跷跷板",
            "sandbox 沙坑"
        ],
        "物品": [
            "ball 球",
            "kite 风筝",
            "bicycle 自行车",
            "bench 长椅",
            "fountain 喷泉",
            "trash can 垃圾桶"
        ],
        "环境": [
            "tree 树",
            "grass 草地",
            "flower 花",
            "path 小路",
            "pond 池塘"
        ]
    },
    "动物园": {
        "核心": [
            "zookeeper 饲养员",
            "cage 笼子",
            "fence 围栏",
            "ticket booth 售票处"
        ],
        "物品": [
            "lion 狮子",
            "elephant 大象",
            "monkey 猴子",
            "panda 熊猫",
            "giraffe 长颈鹿",
            "ticket 门票",
            "camera 相机"
        ],
        "环境": [
            "signboard 指示牌",
            "visitor center 游客中心",
            "food stand 小卖部",
            "rest area 休息区"
        ]
    },
    "学校": {
        "核心": [
            "teacher 老师",
            "student 学生",
            "classroom 教室",
            "blackboard 黑板"
        ],
        "物品": [
            "desk 课桌",
            "chair 椅子",
            "book 书",
            "pencil 铅笔",
            "eraser 橡皮",
            "schoolbag 书包",
            "ruler 尺子"
        ],
        "环境": [
            "playground 操场",
            "library 图书馆",
            "flag 国旗",
            "corridor 走廊"
        ]
    }
};

// 获取预设场景词汇
function getPresetVocabulary(scene) {
    return PRESET_VOCABULARY[scene] || null;
}

// 检查是否为预设场景
function isPresetScene(scene) {
    return PRESET_VOCABULARY.hasOwnProperty(scene);
}

// 获取所有预设场景名称
function getPresetScenes() {
    return Object.keys(PRESET_VOCABULARY);
}
