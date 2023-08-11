const {Keyboard} = require('vk-io')

class KeyboardButtons
{
    none = Keyboard.keyboard([])
    inlineNone = Keyboard.keyboard([]).inline()

    build = (buttons) => {
        return Keyboard.keyboard(buttons)
    }

    secondaryButton = (params) => {
        return Keyboard.textButton({
            label: params[0],
            color: Keyboard.SECONDARY_COLOR,
            payload: {
                choice: params[1]
            }
        })
    }

    startButton = (params) => {
        return Keyboard.textButton({
            label: "🏁 Начать",
            color: Keyboard.SECONDARY_COLOR,
            payload: {
                choice: params
            }
        })
    }

    cancelButton = Keyboard.textButton({
        label: '🚫 Отмена',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'cancel'
        }
    })

    defaultsButton = Keyboard.textButton({
        label: '📌 По умолчанию',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'defaults'
        }
    })

    backButton = Keyboard.textButton({
        label: '🔙 Назад',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'back'
        }
    })

    yesButton = Keyboard.textButton({
        label: '✅ Да',
        color: Keyboard.POSITIVE_COLOR,
        payload: {
            choice: 'yes'
        }
    })

    noButton = Keyboard.textButton({
        label: '❌ Нет',
        color: Keyboard.NEGATIVE_COLOR,
        payload: {
            choice: 'no'
        }
    })

    leftButton = Keyboard.textButton({
        label: '⏪',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'left'
        }
    })

    rightButton = Keyboard.textButton({
        label: '⏩',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'right'
        }
    })

    registrationButton = Keyboard.textButton({
        label: '🔰Зарегистрироваться',
        color: Keyboard.POSITIVE_COLOR,
        payload: {
            choice: 'registration'
        }
    })

    manButton = Keyboard.textButton({
        label: '♂ Мужчина',
        color: Keyboard.PRIMARY_COLOR,
        payload: {
            choice: 'man'
        }
    })

    womanButton = Keyboard.textButton({
        label: '♀ Женщина',
        color: Keyboard.NEGATIVE_COLOR,
        payload: {
            choice: 'woman'
        }
    })

    adminPanelButton = Keyboard.textButton({
        label: '🎚 Админка',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'admin'
        }
    })

    menuButton = Keyboard.textButton({
        label: '🧭 Меню',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'menu'
        }
    })

    GMMenuButton = Keyboard.textButton({
        label: '✨ ГМ-панель',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'gm_menu'
        }
    })

    mayorMenuButton = Keyboard.textButton({
        label: '🏙 Управление городом',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'mayor_menu'
        }
    })

    leaderMenuButton = Keyboard.textButton({
        label: '👑 Управление государством',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'leader_menu'
        }
    })

    giveRoleButton = Keyboard.textButton({
        label: '⤵ Назначить роль',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'give_role'
        }
    })

    controlsButton = Keyboard.textButton({
        label: '🎛 Управление',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'controls'
        }
    })

    sqlButton = Keyboard.textButton({
        label: '💭 SQL',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'sql'
        }
    })

    createCountryButton = Keyboard.textButton({
        label: '➕ Создать фракцию',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'create_country'
        }
    })

    removeCountryButton = Keyboard.textButton({
        label: '✖ Удалить фракцию',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'remove_country'
        }
    })

    appointLeaderCountryButton = Keyboard.textButton({
        label: '🫅 Назначить правителя',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'appoint_leader'
        }
    })

    woodButton = Keyboard.textButton({
        label: '🪵 Дерево',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'wood'
        }
    })

    stoneButton = Keyboard.textButton({
        label: '🪨 Камень',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'stone'
        }
    })

    ironButton = Keyboard.textButton({
        label: '🌑 Железо',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'iron'
        }
    })

    copperButton = Keyboard.textButton({
        label: '🪙 Бронза',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'copper'
        }
    })

    silverButton = Keyboard.textButton({
        label: '🥈 Серебро',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'silver'
        }
    })

    warningsButton = Keyboard.textButton({
        label: '⚠ Предупреждения',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'warnings'
        }
    })

    bansButton = Keyboard.textButton({
        label: '💀 Баны',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'bans'
        }
    })

    effectsButton = Keyboard.textButton({
        label: '🔮 Эффекты',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'effects'
        }
    })

    profileButton = Keyboard.textButton({
        label: '📂 Профиль',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'profile'
        }
    })

    resourcesButton = Keyboard.textButton({
        label: '🛒 Ресурсы',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'resources'
        }
    })

    parametersButton = Keyboard.textButton({
        label: '⚙ Параметры',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'params'
        }
    })

    mapButton = Keyboard.textButton({
        label: '🌍 Карта',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'map'
        }
    })

    propertyButton = Keyboard.textButton({
        label: '🏠 Имущество',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'property'
        }
    })

    extractButton = Keyboard.textButton({
        label: '⛏ Добыча',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'extract'
        }
    })

    extractWheatButton = Keyboard.textButton({
        label: '🌾 Добывать зерно',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'extract_wheat'
        }
    })

    extractStoneButton = Keyboard.textButton({
        label: '⛏ Добывать камень',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'extract_stone'
        }
    })

    extractWoodButton = Keyboard.textButton({
        label: '🪓 Добывать дерево',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'extract_wood'
        }
    })


    extractIronButton = Keyboard.textButton({
        label: '⛏ Добывать железо',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'extract_iron'
        }
    })

    extractCopperButton = Keyboard.textButton({
        label: '⛏ Добывать бронзу',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'extract_copper'
        }
    })

    extractSilverButton = Keyboard.textButton({
        label: '⛏ Добывать серебро',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'extract_silver'
        }
    })

    ratingsButton = Keyboard.textButton({
        label: '🌟 Рейтинги',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'ratings'
        }
    })

    relaxButton = Keyboard.textButton({
        label: '💤 Отдохнуть',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'relax'
        }
    })

    chatListButton = Keyboard.textButton({
        label: '🚩 Фракции',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'chat_list'
        }
    })

    locationButton = Keyboard.textButton({
        label: '🌐 Мир',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'location'
        }
    })

    whereMeButton = Keyboard.textButton({
        label: '🧭 Где я?',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'where_me'
        }
    })

    buildingsButton = Keyboard.textButton({
        label: '🏘 Постройки',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'buildings'
        }
    })

    otherCity = Keyboard.textButton({
        label: '🔄 В другой город',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'other_city'
        }
    })

    otherCountry = Keyboard.textButton({
        label: '🔃 В другую фракцию',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'other_country'
        }
    })

    postboxButton = Keyboard.textButton({
        label: '📫 Почтовый ящик',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'postbox'
        }
    })

    getCitizenshipButton = Keyboard.textButton({
        label: '➕ Подать на гражданство',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'get_citizenship'
        }
    })

    refuseCitizenshipButton = Keyboard.textButton({
        label: '❌ Отказаться от гражданства',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'refuse_citizenship'
        }
    })

    getRegistrationButton = Keyboard.textButton({
        label: '➕ Прописаться в городе',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'get_registration'
        }
    })

    refuseRegistrationButton = Keyboard.textButton({
        label: '❌ Отказаться от прописки',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'refuse_registration'
        }
    })

    merryButton = Keyboard.textButton({
        label: '💍 Вступить в брак',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'merry'
        }
    })

    refuseMerryButton = Keyboard.textButton({
        label: '💔 Подать на развод',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'divorce'
        }
    })



    aboutMeButton = Keyboard.textButton({
        label: '💪 Обо мне',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'about_me'
        }
    })

    transactionButton = Keyboard.textButton({
        label: '🔀 Перевести',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'transaction'
        }
    })

    createLastWillButton = Keyboard.textButton({
        label: '✍ Написать завещание',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'create_last_will'
        }
    })

    deleteLastWillButton = Keyboard.textButton({
        label: '🗑 Удалить завещание',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'delete_last_will'
        }
    })

    newBuildingButton = Keyboard.textButton({
        label: '🏗 Построить',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'new_building'
        }
    })

    deleteBuildingButton = Keyboard.textButton({
        label: '❌ Снести постройку',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'delete_building'
        }
    })

    listButton = Keyboard.textButton({
        label: '📋 Список',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'list'
        }
    })

    buildButton = Keyboard.textButton({
        label: '🏗 Построить',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'build'
        }
    })

    upgradeButton = Keyboard.textButton({
        label: '⬆ Улучшить',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'upgrade'
        }
    })

    giveKeyButton = Keyboard.textButton({
        label: '🔑 Отдать ключ',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'give_key'
        }
    })

    copyKeyButton = Keyboard.textButton({
        label: '🔑🔑 Сделать дубликат ключа',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'copy_key'
        }
    })

    wakeupButton = Keyboard.textButton({
        label: '☕ Взбодриться',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'wakeup'
        }
    })

    richButton = Keyboard.textButton({
        label: '💰 Богачи',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'rich'
        }
    })

    mostActiveButton = Keyboard.textButton({
        label: '🎆 Самые активные',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'most_active'
        }
    })

    playersListButton = Keyboard.textButton({
        label: '📍 Список людей',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'players_list'
        }
    })


    mostUnculturedButton = Keyboard.textButton({
        label: '🤬 Некультурные',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'uncultured'
        }
    })

    stickermansButton = Keyboard.textButton({
        label: '💩 Любители стикеров',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'stickermans'
        }
    })

    musicLoversButton = Keyboard.textButton({
        label: '🎵 Любители музыки',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'music_lovers'
        }
    })

    moneyButton = Keyboard.textButton({
        label: '💵 Деньги',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'money'
        }
    })

    wheatButton = Keyboard.textButton({
        label: '🌾 Зерно',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'wheat'
        }
    })

    diamondButton = Keyboard.textButton({
        label: '💎 Алмазы',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'diamond'
        }
    })

    adminsButton = Keyboard.textButton({
        label: '📋 Список админов',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'admins'
        }
    })

    infoButton = Keyboard.textButton({
        label: 'ℹ Информация',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'info'
        }
    })

    notificationsOnButton = Keyboard.textButton({
        label: '🔊 Включить уведомления',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'notifications_on'
        }
    })

    notificationsOffButton = Keyboard.textButton({
        label: '🔇 Отключить уведомления',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'notifications_off'
        }
    })

    getResourcesButton = Keyboard.textButton({
        label: '🫳 Собрать ресурсы',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'get_resource'
        }
    })

    changeMoneyButton = Keyboard.textButton({
        label: '💱 Обменять серебро на деньги',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'change_money'
        }
    })

    checkTimeButton = Keyboard.textButton({
        label: '⏰ Время',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'check_time'
        }
    })

    expandButton = Keyboard.textButton({
        label: '↔ Расширить',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'expand'
        }
    })

    cityInfoButton = Keyboard.textButton({
        label: 'ℹ Информация о городе',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'city_info'
        }
    })

    nameButton= Keyboard.textButton({
        label: '⏏ Изменить название',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'name'
        }
    })

    descriptionButton= Keyboard.textButton({
        label: '⏏ Изменить описание',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'description'
        }
    })

    publicButton= Keyboard.textButton({
        label: '⏏ Изменить группу',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'public'
        }
    })

    photoButton = Keyboard.textButton({
        label: '⏏ Изменить фото',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'photo'
        }
    })

    welcomePictureButton = Keyboard.textButton({
        label: '⏏ Изменить приветственное фото',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'welcome_picture'
        }
    })

    budgetButton = Keyboard.textButton({
        label: '💰 Бюджет',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'budget'
        }
    })

    officialsButton = Keyboard.textButton({
        label: '💼 Чиновники',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'officials'
        }
    })

    citiesButton = Keyboard.textButton({
        label: '🌇 Города',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'cities'
        }
    })

    countryInfoButton = Keyboard.textButton({
        label: 'ℹ Информация о фракции',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'country_info'
        }
    })

    getTaxButton = Keyboard.textButton({
        label: '📥 Собрать все налоги',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'get_tax'
        }
    })

    setMayorButton = Keyboard.textButton({
        label: '💼 Назначить градоначальника',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'set_mayor'
        }
    })

    buildRoadButton = Keyboard.textButton({
        label: '🛣 Построить дорогу',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'build_road'
        }
    })

    buildCityButton = Keyboard.textButton({
        label: '🏙 Возвести город',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'build_city'
        }
    })

    removeCityButton = Keyboard.textButton({
        label: '✖ Удалить город',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'remove_city'
        }
    })

    setTaxButton = Keyboard.textButton({
        label: '📊 Установить налог',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'set_tax'
        }
    })

    nextButton = Keyboard.textButton({
        label: '⏭ Далее',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'next'
        }
    })

    officialListButton = Keyboard.textButton({
        label: '📃 Список чиновников',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'official_list'
        }
    })

    setButton = Keyboard.textButton({
        label: '⤵ Назначить',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'set'
        }
    })

    changeRightsButton = Keyboard.textButton({
        label: '🛂 Управление возможностями',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'change_rights'
        }
    })

    takeAwayRightsButton = Keyboard.textButton({
        label: '❌ Забрать права',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'take_away'
        }
    })

    takeAwayCitizenshipButton = Keyboard.textButton({
        label: '❌ Забрать гражданство',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'take_away_citizenship'
        }
    })

    usersButton = Keyboard.textButton({
        label: '🧑 Игроки',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'users'
        }
    })

    technicalButton = Keyboard.textButton({
        label: '⚙ Техническое',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'technical'
        }
    })

    cheatingResourceButton = Keyboard.textButton({
        label: '⤴ Накрутить ресурс',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'cheating_resource'
        }
    })

    cheatingDiamondsButton = Keyboard.textButton({
        label: '💎 Накрутить алмазы',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'cheating_diamonds'
        }
    })

    uploadLogButton = Keyboard.textButton({
        label: '⬇ Загрузить лог',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'upload_log'
        }
    })

    logListButton = Keyboard.textButton({
        label: '🗒 Список логов',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'log_list'
        }
    })

    clearLogsButton = Keyboard.textButton({
        label: '🗑 Очистить логи',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'clear_logs'
        }
    })

    clearUserCacheButton = Keyboard.textButton({
        label: '🗑 Очистить кэш пользователей',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'clear_user_cache'
        }
    })

    uploadMapButton = Keyboard.textButton({
        label: '🗺 Обновить карту',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'upload_map'
        }
    })

    variablesButton = Keyboard.textButton({
        label: '💲 Переменные',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'variables'
        }
    })

    addTheChatButton = Keyboard.textButton({
        label: '💬 Чаты',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'add_the_chat'
        }
    })

    addMessageButton = Keyboard.textButton({
        label: '➕ Написать сообщение',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'add_message'
        }
    })


    eventsButton = Keyboard.textButton({
        label: '🎮 События',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'events'
        }
    })

    applyEffectsButton = Keyboard.textButton({
        label: '🪄 Наложить эффект',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'apply_effects'
        }
    })

    removeEffectsButton = Keyboard.textButton({
        label: '🥛 Снять эффект',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'remove_effects'
        }
    })

    roadsButton = Keyboard.textButton({
        label: '🛣 Дороги',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'roads'
        }
    })

    userInfoButton = Keyboard.textButton({
        label: 'ℹ Информация об игроке',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'user_info'
        }
    })

    buildingInfoButton = Keyboard.textButton({
        label: 'ℹ Информация о здании',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'building_info'
        }
    })

    teleportButton = Keyboard.textButton({
        label: '✨ Телепортировать',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'teleport'
        }
    })

    changeNickButton = Keyboard.textButton({
        label: '⏏ Изменить ник',
        color: Keyboard.SECONDARY_COLOR,
        payload: {
            choice: 'change_nick'
        }
    })

    //Callback buttons
    acceptCallbackButton = (obj) => {
        obj.parameter = obj.parameter || null
        return Keyboard.callbackButton({
            label: '✅ Принять',
            color: Keyboard.POSITIVE_COLOR,
            payload: {
                command: obj.command,
                item: obj.item,
                addition: obj.parameter
            }
        })
    }

    declineCallbackButton = (obj) => {
        obj.parameter = obj.parameter || null
        return Keyboard.callbackButton({
            label: '⛔ Отклонить',
            color: Keyboard.NEGATIVE_COLOR,
            payload: {
                command: obj.command,
                item: obj.item,
                addition: obj.parameter
            }
        })
    }

    startCallbackButton = (obj) => {
        obj.addition = obj.addition || null
        return Keyboard.callbackButton({
            label: '🏁 Начать',
            color: Keyboard.SECONDARY_COLOR,
            payload: {
                command: obj.command,
                item: obj.item,
                addition: obj.addition
            }
        })
    }

    appealCallbackButton = (obj) => {
        obj.addition = obj.addition || null
        return Keyboard.callbackButton({
            label: '✅ Обжаловать',
            color: Keyboard.POSITIVE_COLOR,
            payload: {
                command: obj.command,
                item: obj.item
            }
        })
    }

    hideCallbackButton = () => {
        return Keyboard.callbackButton({
            label: '✖ Скрыть',
            color: Keyboard.SECONDARY_COLOR,
            payload: {
                command: "hide_message"
            }
        })
    }

    //Chat buttons
    greenButton = (context) => {
        return Keyboard.textButton({
            label: context.name,
            color: Keyboard.POSITIVE_COLOR,
            payload: {
                type: context.type,
                action: context.action
            }
        })
    }

    greyButton = (context) => {
        return Keyboard.textButton({
            label: context.name,
            color: Keyboard.SECONDARY_COLOR,
            payload: {
                type: context.type,
                action: context.action
            }
        })
    }

    lightButton = (context) => {
        return Keyboard.textButton({
            label: context.name,
            color: Keyboard.PRIMARY_COLOR,
            payload: {
                type: context.type,
                action: context.action
            }
        })
    }
}

module.exports = new KeyboardButtons()