const keyboard = require("../variables/Keyboards")
const Data = require("../models/CacheData")
const NameLibrary = require("../variables/NameLibrary")
const {Chats, Messages, PlayerStatus, Country, City} = require("../database/Models")
const Builders = require("./BuildersAndControlsScripts")
const ErrorHandler = require("../error/ErrorHandler")

class SceneController
{
    // Стартовый экран
    GetStartMenuKeyboard = (context) =>
    {
        let kb = [
            [keyboard.menuButton]
        ]
        if(Data.cities[context.player.location]?.leaderID === context.player.id || NameLibrary.RoleEstimator(context.player.role) > 2)
        {
            if(!kb[1]) kb[1] = []
            kb[1].push(keyboard.mayorMenuButton)
        }
        if(Data.countries[context.player.countryID]?.leaderID === context.player.id || NameLibrary.RoleEstimator(context.player.role) > 2 || context.official)
        {
            if(!kb[1]) kb[1] = []
            kb[1].push(keyboard.leaderMenuButton)
        }
        if(NameLibrary.RoleEstimator(context.player.role) === 2)
        {
            if(!kb[1]) kb[1] = []
            kb[1].push(keyboard.GMMenuButton)
        }
        if(NameLibrary.RoleEstimator(context.player.role) > 2)
        {
            if(!kb[2]) kb[2] = []
            kb[2].push(keyboard.GMMenuButton)
        }
        if(NameLibrary.RoleEstimator(context.player.role) > 2)
        {
            if(!kb[2]) kb[2] = []
            kb[2].push(keyboard.adminPanelButton)
        }
        return kb
    }

    StartScreen = async(context) =>
    {
        try
        {
            if("object" === typeof context.messagePayload?.choice)
            {
                context.send("👉🏻 Главное меню",{
                    keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                })
                return
            }
            if(context.messagePayload?.choice?.match(/menu|admin|mayor_menu|leader_menu|gm_menu/))
            {
                if(context.messagePayload.choice === "menu")
                {
                    context.send("▶ Меню",{
                        keyboard: keyboard.build(this.GetMenuKeyboard())
                    })
                    context.player.state = this.Menu
                }
                if(context.messagePayload.choice === "mayor_menu" && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.cities[context.player.location].leaderID === context.player.id))
                {
                    context.send("▶ Управление городом",{
                        keyboard: keyboard.build(this.GetCityControlsKeyboard())
                    })
                    context.player.state = this.CityControlsMenu
                }
                if(context.messagePayload.choice === "leader_menu" && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official))
                {
                    context.send("▶ Управление фракцией",{
                        keyboard: keyboard.build(this.GetGovernanceCountryMenuKeyboard())
                    })
                    context.player.state = this.GovernanceCountryMenu
                }
                if(context.messagePayload.choice === "admin" && NameLibrary.RoleEstimator(context.player.role) > 2)
                {
                    context.send("▶ Админка",{
                        keyboard: keyboard.build(this.GetAdminMenuKeyboard(context))
                    })
                    context.player.state = this.AdminPanel
                }
                if(context.messagePayload.choice === "gm_menu" && NameLibrary.RoleEstimator(context.player.role) > 1)
                {
                    context.send("▶ ГМ-панель",{
                        keyboard: keyboard.build(this.GetGMMenuKeyboard())
                    })
                    context.player.state = this.GMMenu
                }
            }
            else
            {
                context.send("👉🏻 Главное меню",{
                    keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/StartScreen", e)
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    //Ожидание
    WaitingWalkMenu = async (context) => {
        if(context.player.timeout)
        {
            context.send(`♿ Вы находитесь в пути.\n\nДо прибытия ${NameLibrary.ParseFutureTime(context.player.lastActionTime)}`, {
                keyboard: keyboard.none
            })
        }
        else
        {
            context.player.state = this.StartScreen
            context.send("👉🏻 Главное меню",{
                keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
            })
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    GetGMMenuKeyboard = () =>
    {
        return [
            [keyboard.eventsButton, keyboard.controlsButton],
            [keyboard.applyEffectsButton, keyboard.removeEffectsButton],
            [keyboard.backButton]
        ]

    }

    GetGMControlsMenuKeyboard = () =>
    {
        return [
            [keyboard.usersButton],
            [keyboard.citiesButton, keyboard.buildingsButton],
            [keyboard.chatListButton, keyboard.roadsButton],
            [keyboard.backButton]
        ]
    }

    GetGMUsersMenuKeyboard = () =>
    {
        return [
            [keyboard.userInfoButton, keyboard.cheatingResourceButton, keyboard.teleportButton],
            [keyboard.backButton]
        ]
    }

    GetGMCitiesMenuKeyboard = () =>
    {
        return [
            [keyboard.cityInfoButton, keyboard.cheatingResourceButton],
            [keyboard.backButton]
        ]
    }

    GetGMBuildingsMenuKeyboard = () =>
    {
        return [
            [keyboard.buildingInfoButton],
            [keyboard.backButton]
        ]
    }

    GetGMCountriesMenuKeyboard = () =>
    {
        return [
            [keyboard.countryInfoButton, keyboard.cheatingResourceButton, keyboard.resourcesButton],
            [keyboard.backButton]
        ]
    }

    GMMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetGMMenuKeyboard()
            if(context.messagePayload?.choice.match(/back|events|apply_effects|remove_effects|controls/))
            {
                if(context.messagePayload?.choice.match(/back/))
                {
                    await context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                    })
                    context.player.state = this.StartScreen
                }
                if(context.messagePayload?.choice.match(/controls/))
                {
                    await context.send("↪ Управление",{
                        keyboard: keyboard.build(this.GetGMControlsMenuKeyboard())
                    })
                    context.player.state = this.GMControlsMenu
                }
                if(context.messagePayload?.choice.match(/remove_effects/))
                {
                    await Builders.RemoveEffect(context, current_keyboard)
                }
                if(context.messagePayload?.choice.match(/apply_effects/))
                {
                    await Builders.AddEffect(context, current_keyboard)
                }
                if(context.messagePayload?.choice.match(/events/))
                {
                    await Builders.Events(context, current_keyboard)
                }
            }
            else
            {
                await context.send("👉🏻 ГМ-панель",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/GMMenu", e)
        }
    }

    GMControlsMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetGMControlsMenuKeyboard()
            if(context.messagePayload?.choice.match(/back|roads|users|cities|buildings|chat_list/))
            {
                if(context.messagePayload?.choice.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetGMMenuKeyboard(context))
                    })
                    context.player.state = this.GMMenu
                }
                if(context.messagePayload?.choice.match(/roads/))
                {
                    await Builders.RoadControls(context, current_keyboard)
                }
                if(context.messagePayload?.choice.match(/users/))
                {
                    context.send("▶ Игроки", {
                        keyboard: keyboard.build(this.GetGMUsersMenuKeyboard())
                    })
                    context.player.state = this.GMUsersMenu
                }
                if(context.messagePayload?.choice.match(/cities/))
                {
                    context.send("▶ Города", {
                        keyboard: keyboard.build(this.GetGMCitiesMenuKeyboard())
                    })
                    context.player.state = this.GMCitiesMenu
                }
                if(context.messagePayload?.choice.match(/buildings/))
                {
                    context.send("▶ Постройки", {
                        keyboard: keyboard.build(this.GetGMBuildingsMenuKeyboard())
                    })
                    context.player.state = this.GMBuildingsMenu
                }
                if(context.messagePayload?.choice.match(/chat_list/))
                {
                    context.send("▶ Фракции", {
                        keyboard: keyboard.build(this.GetGMCountriesMenuKeyboard())
                    })
                    context.player.state = this.GMCountriesMenu
                }
            }
            else
            {
                context.send("👉🏻 Управление",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/GMControlsMenu", e)
        }
    }

    GMCountriesMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetGMCountriesMenuKeyboard()
            if(context.messagePayload?.choice.match(/back|cheating_resource|country_info|resources/))
            {
                if(context.messagePayload?.choice.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetGMControlsMenuKeyboard())
                    })
                    context.player.state = this.GMControlsMenu
                }
                if (context.messagePayload.choice.match(/cheating_resource/))
                {
                    await Builders.CheatingCountryResources(context, current_keyboard)
                }
                if(context.messagePayload?.choice.match(/country_info/))
                {
                    await Builders.GetCountryInfo(context, current_keyboard)
                }
                if(context.messagePayload?.choice.match(/resources/))
                {
                    await Builders.ChangeCountryResource(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Игроки",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/GMCountriesMenu", e)
        }
    }

    GMBuildingsMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetGMBuildingsMenuKeyboard()
            if(context.messagePayload?.choice.match(/back|building_info/))
            {
                if(context.messagePayload?.choice.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetGMControlsMenuKeyboard())
                    })
                    context.player.state = this.GMControlsMenu
                }
                if(context.messagePayload?.choice.match(/building_info/))
                {
                    await Builders.GetBuildingInfo(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Постройки",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/GMBuildingsMenu", e)
        }
    }

    GMCitiesMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetGMCitiesMenuKeyboard()
            if(context.messagePayload?.choice.match(/back|cheating_resource|city_info/))
            {
                if(context.messagePayload?.choice.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetGMControlsMenuKeyboard())
                    })
                    context.player.state = this.GMControlsMenu
                }
                if (context.messagePayload.choice.match(/cheating_resource/))
                {
                    await Builders.CheatingCityResources(context, current_keyboard)
                }
                if(context.messagePayload?.choice.match(/city_info/))
                {
                    await Builders.GetCityInfo(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Игроки",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/GMCitiesMenu", e)
        }
    }

    GMUsersMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetGMUsersMenuKeyboard()
            if(context.messagePayload?.choice.match(/back|cheating_resource|user_info|teleport/))
            {
                if(context.messagePayload?.choice.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetGMControlsMenuKeyboard())
                    })
                    context.player.state = this.GMControlsMenu
                }
                if (context.messagePayload.choice.match(/cheating_resource/))
                {
                    await Builders.CheatingUserResources(context, current_keyboard)
                }
                if(context.messagePayload?.choice.match(/user_info/))
                {
                    await Builders.GetUserInfo(context, current_keyboard)
                }
                if(context.messagePayload?.choice.match(/teleport/))
                {
                    await Builders.TeleportUser(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Игроки",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/GMUsersMenu", e)
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    //Админ-панель
    GetAdminMenuKeyboard = (context) =>
    {
        const kb = [
            [keyboard.usersButton, keyboard.chatListButton],
            [keyboard.citiesButton],
            [keyboard.backButton]
        ]
        NameLibrary.RoleEstimator(context.player.role) >= 4 && kb[1].push(keyboard.technicalButton)
        return kb
    }

    GetAdminTechnicalMenuKeyboard = () =>
    {
        return [
            [keyboard.uploadMapButton],
            [keyboard.logListButton, keyboard.uploadLogButton, keyboard.clearLogsButton],
            [keyboard.sqlButton, keyboard.clearUserCacheButton, keyboard.variablesButton],
            [keyboard.backButton]
        ]
    }

    GetAdminCountriesMenuKeyboard = () =>
    {
        return [
            [keyboard.createCountryButton, keyboard.removeCountryButton],
            [keyboard.appointLeaderCountryButton, keyboard.addTheChatButton],
            [keyboard.backButton]
        ]
    }

    GetAdminsCitiesMenuKeyboard = () =>
    {
        return [
            [keyboard.setMayorButton],
            [keyboard.buildCityButton, keyboard.removeCityButton],
            [keyboard.backButton]
        ]
    }

    GetAdminUsersMenuKeyboard = () =>
    {
        return [
            [keyboard.warningsButton, keyboard.bansButton],
            [keyboard.giveRoleButton, keyboard.addMessageButton, keyboard.cheatingDiamondsButton],
            [keyboard.backButton]
        ]
    }

    AdminPanel = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetAdminMenuKeyboard(context)
            if(NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice.match(/back|chat_list|users|technical|cities/))
            {
                if(context.messagePayload?.choice.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                    })
                    context.player.state = this.StartScreen
                }
                if(context.messagePayload?.choice.match(/chat_list/))
                {
                    context.send("▶ Фракции",{
                        keyboard: keyboard.build(this.GetAdminCountriesMenuKeyboard())
                    })
                    context.player.state = this.AdminCountriesMenu
                }
                if(context.messagePayload?.choice.match(/users/))
                {
                    context.send("▶ Пользователи",{
                        keyboard: keyboard.build(this.GetAdminUsersMenuKeyboard())
                    })
                    context.player.state = this.AdminUsersMenu
                }
                if(context.messagePayload?.choice.match(/technical/))
                {
                    context.send("▶ Техническое",{
                        keyboard: keyboard.build(this.GetAdminTechnicalMenuKeyboard())
                    })
                    context.player.state = this.AdminTechnicalMenu
                }
                if(context.messagePayload?.choice.match(/cities/))
                {
                    context.send("▶ Города",{
                        keyboard: keyboard.build(this.GetAdminsCitiesMenuKeyboard())
                    })
                    context.player.state = this.AdminCitiesMenu
                }
            }
            else if(context.command.match(/карусель/))
            {
                await Builders.TestCorusel()
            }
            else
            {
                context.send("👉🏻 Админка",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/AdminPanel", e)
        }
    }

    AdminTechnicalMenu = async (context) =>
    {
        try
        {
            const current_keyboard = this.GetAdminTechnicalMenuKeyboard()
            if(NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice.match(/back|sql|upload_log|log_list|clear_logs|clear_user_cache|upload_map|variables/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetAdminMenuKeyboard(context))
                    })
                    context.player.state = this.AdminPanel
                }
                if(context.messagePayload?.choice.match(/sql/))
                {
                    await Builders.SQLSession(context, current_keyboard)
                }
                if(context.messagePayload?.choice.match(/upload_log/))
                {
                    await Builders.SendLog(context, current_keyboard)
                }
                if(context.messagePayload?.choice.match(/log_list/))
                {
                    await Builders.SendLogList(context, current_keyboard)
                }
                if(context.messagePayload?.choice.match(/clear_logs/))
                {
                    await Builders.ClearLogs(context, current_keyboard)
                }
                if(context.messagePayload?.choice.match(/clear_user_cache/))
                {
                    await Builders.ClearUserCache(context, current_keyboard)
                }
                if(context.messagePayload?.choice.match(/upload_map/))
                {
                    await Builders.ChangeMap(context, current_keyboard)
                }
                if(context.messagePayload?.choice.match(/variables/))
                {
                    await Builders.ChangeVariables(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Управление",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/AdminTechnicalMenu", e)
        }
    }

    AdminCountriesMenu = async (context) =>
    {
        try
        {
            const current_keyboard = this.GetAdminCountriesMenuKeyboard()
            if(NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice.match(/back|create_country|remove_country|appoint_leader|add_the_chat/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetAdminMenuKeyboard(context))
                    })
                    context.player.state = this.AdminPanel
                }
                if(context.messagePayload.choice.match(/create_country/))
                {
                    await Builders.NewCountry(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/appoint_leader/))
                {
                    await Builders.AppointLeader(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/add_the_chat/))
                {
                    await Builders.ChatControls(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/remove_country/))
                {
                    await Builders.RemoveCountry(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Управление",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/AdminControlsMenu", e)
        }
    }

    AdminCitiesMenu = async (context) =>
    {
        try
        {
            const current_keyboard = this.GetAdminsCitiesMenuKeyboard()
            if(NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice.match(/back|set_mayor|build_city|remove_city/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetAdminMenuKeyboard(context))
                    })
                    context.player.state = this.AdminPanel
                }
                if(context.messagePayload.choice.match(/build_city/))
                {
                    await Builders.CreateNewCity(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/remove_city/))
                {
                    await Builders.RemoveCity(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/set_mayor/))
                {
                    await Builders.SetMayor(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Управление",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/AdminControlsMenu", e)
        }
    }

    AdminUsersMenu = async (context) =>
    {
        try
        {
            const current_keyboard = this.GetAdminUsersMenuKeyboard()
            if(NameLibrary.RoleEstimator(context.player.role) < 3)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice.match(/back|warnings|bans|add_message|give_role|cheating_diamonds/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetAdminMenuKeyboard(context))
                    })
                    context.player.state = this.AdminPanel
                }
                if (context.messagePayload.choice.match(/warnings/))
                {
                    await Builders.Warnings(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/bans/))
                {
                    await Builders.Bans(context, current_keyboard)
                }
                if(context.messagePayload?.choice.match(/give_role/))
                {
                    await Builders.ChangeRole(context, current_keyboard, {
                        GetStartMenuKeyboard: this.GetStartMenuKeyboard,
                        StayInStartScreen: this.StartScreen
                    })
                }
                if(context.messagePayload.choice.match(/add_message/))
                {
                    await Builders.AddMessage(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/cheating_diamonds/))
                {
                    await Builders.CheatingUserDiamonds(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Статистика",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/AdminUsersMenu", e)
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    //Меню правителя

    GetGovernanceCountryMenuKeyboard = () =>
    {
        return [
            [keyboard.controlsButton],
            [keyboard.budgetButton, keyboard.infoButton],
            [keyboard.officialsButton, keyboard.parametersButton],
            [keyboard.backButton]
        ]
    }

    GetCountryInfoMenuKeyboard = () =>
    {
        return [
            [keyboard.resourcesButton, keyboard.playersListButton],
            [keyboard.citiesButton, keyboard.countryInfoButton],
            [keyboard.backButton]
        ]
    }

    GetChangeCountryMenuKeyboard = (context) =>
    {
        let kb = [
            [keyboard.nameButton],
            [keyboard.descriptionButton, keyboard.publicButton],
            [keyboard.photoButton, keyboard.welcomePictureButton],
            [keyboard.backButton]
        ]
        if(Data.countries[context.player.countryID].notifications) kb[0].push(keyboard.notificationsOffButton)
        else kb[0].push(keyboard.notificationsOnButton)
        return kb
    }

    GetCountryBudgetMenuKeyboard = () =>
    {
        return [
            [keyboard.getTaxButton],
            [keyboard.transactionButton, keyboard.getResourcesButton],
            [keyboard.backButton]
        ]
    }

    GetCountryControlsMenuKeyboard = () =>
    {
        return [
            [keyboard.setTaxButton, keyboard.buildRoadButton],
            [keyboard.buildCityButton, keyboard.buildingsButton],
            [keyboard.takeAwayCitizenshipButton, keyboard.setMayorButton],
            [keyboard.backButton]
        ]
    }

    GetCountryOfficialsMenuKeyboard = () =>
    {
        return [
            [keyboard.officialListButton],
            [keyboard.changeRightsButton, keyboard.setButton],
            [keyboard.takeAwayRightsButton],
            [keyboard.backButton]
        ]
    }

    GetCountryBuildingsMenuKeyboard = () =>
    {
        return [
            [keyboard.newBuildingButton, keyboard.upgradeButton],
            [keyboard.backButton]
        ]
    }

    GovernanceCountryMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetGovernanceCountryMenuKeyboard()
            if(context.messagePayload?.choice.match(/back|budget|controls|info|officials|params/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад", {
                        keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                    })
                    context.player.state = this.StartScreen
                }
                if(context.messagePayload.choice.match(/info/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official))
                {
                    context.send("▶ Информация о фракции",{
                        keyboard: keyboard.build(this.GetCountryInfoMenuKeyboard())
                    })
                    context.player.state = this.CountryInfoMenu
                }
                if(context.messagePayload.choice.match(/params/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id))
                {
                    context.send("▶ Параметры",{
                        keyboard: keyboard.build(this.GetChangeCountryMenuKeyboard(context))
                    })
                    context.player.state = this.ChangeCountryMenu
                }
                if(context.messagePayload.choice.match(/controls/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canBuildCity || context.official?.canAppointMayors || context.official?.canBeDelegate))
                {
                    context.send("▶ Управление ",{
                        keyboard: keyboard.build(this.GetCountryControlsMenuKeyboard())
                    })
                    context.player.state = this.CountryControlsMenu
                }
                if(context.messagePayload.choice.match(/budget/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canUseResources))
                {
                    context.send("▶ Бюджет",{
                        keyboard: keyboard.build(this.GetCountryBudgetMenuKeyboard())
                    })
                    context.player.state = this.CountryBudgetMenu
                }
                if(context.messagePayload.choice.match(/officials/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canAppointOfficial))
                {
                    context.send("▶ Чиновники",{
                        keyboard: keyboard.build(this.GetCountryOfficialsMenuKeyboard())
                    })
                    context.player.state = this.CountryOfficialsMenu
                }
            }
            else
            {
                context.send("👉🏻 Управление фракцией",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/GovernanceCountryMenu", e)
        }
    }

    CountryOfficialsMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetCountryOfficialsMenuKeyboard()
            context.country = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id || context.official)
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice.match(/back|official_list|set|change_rights|take_away/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад", {
                        keyboard: keyboard.build(this.GetGovernanceCountryMenuKeyboard(context))
                    })
                    context.player.state = this.GovernanceCountryMenu
                }
                if (context.messagePayload.choice.match(/official_list/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canAppointOfficial))
                {
                    await Builders.GetCountryOfficials(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/set/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canAppointOfficial))
                {
                    await Builders.SetOfficial(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/change_rights/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id))
                {
                    await Builders.ChangeOfficial(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/take_away/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id))
                {
                    await Builders.TakeAwayOfficial(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Чиновники",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/CountryOfficialsMenu", e)
        }
    }

    CountryControlsMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetCountryControlsMenuKeyboard()
            context.country = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id || context.official)
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice.match(/back|set_mayor|build_city|set_tax|buildings|take_away_citizenship/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад", {
                        keyboard: keyboard.build(this.GetGovernanceCountryMenuKeyboard(context))
                    })
                    context.player.state = this.GovernanceCountryMenu
                }
                if (context.messagePayload.choice.match(/set_mayor/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canAppointMayors))
                {
                    await Builders.SetMayor(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/set_tax/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id))
                {
                    await Builders.SetTax(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/build_city/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canBuildCity))
                {
                    await Builders.BuildNewCity(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/buildings/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canBuildCity))
                {
                    context.send("▶ Постройки", {
                        keyboard: keyboard.build(this.GetCountryBuildingsMenuKeyboard())
                    })
                    context.player.state = this.CountryBuildingsMenu
                }
                if (context.messagePayload.choice.match(/take_away_citizenship/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canBeDelegate))
                {
                    await Builders.TakeAwayCitizenship(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Управление",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/CountryControlsMenu", e)
        }
    }

    CountryBuildingsMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetCountryBuildingsMenuKeyboard()
            context.country = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id || context.official)
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice.match(/back|new_building|upgrade/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад", {
                        keyboard: keyboard.build(this.GetCountryControlsMenuKeyboard(context))
                    })
                    context.player.state = this.CountryControlsMenu
                }
                if (context.messagePayload.choice.match(/new_building/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canBuildCity))
                {
                    await Builders.CreateCountryBuilding(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/upgrade/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canBuildCity))
                {
                    await Builders.UpgradeCountryBuilding(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Постройки",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/CountryBuildingsMenu", e)
        }
    }

    CountryBudgetMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetCountryBudgetMenuKeyboard()
            context.country = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id || context.official)
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice.match(/back|get_tax|transaction|get_resource/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад", {
                        keyboard: keyboard.build(this.GetGovernanceCountryMenuKeyboard(context))
                    })
                    context.player.state = this.GovernanceCountryMenu
                }
                if (context.messagePayload.choice.match(/get_resource/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canUseResources))
                {
                    await Builders.GetAllCountryResources(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/transaction/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canUseResources))
                {
                    if(context.country.isSiege)
                    {
                        await context.send(`В данный момент фракция ${context.country.GetName()} находится в блокаде, переводы ресурсов не возможны`)
                        return
                    }
                    await Builders.CountryTransaction(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/get_tax/) && (NameLibrary.RoleEstimator(context.player.role) > 2 || Data.countries[context.player.countryID].leaderID === context.player.id || context.official?.canUseResources))
                {
                    await Builders.GetCountryTax(context, current_keyboard)
                }
            }
            else
            {
                context.send("👉🏻 Бюджет",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/CountryBudgetMenu", e)
        }
    }

    ChangeCountryMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetChangeCountryMenuKeyboard(context)
            context.country = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id)
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice.match(/back|name|description|public|photo|welcome_picture|notifications_off|notifications_on/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад", {
                        keyboard: keyboard.build(this.GetGovernanceCountryMenuKeyboard(context))
                    })
                    context.player.state = this.GovernanceCountryMenu
                }
                if (context.messagePayload.choice.match(/name/))
                {
                    await Builders.ChangeCountryName(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/description/))
                {
                    await Builders.ChangeCountryDescription(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/public/))
                {
                    await Builders.ChangeCountryGroup(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/photo/))
                {
                    await Builders.ChangeCountryPhoto(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/welcome_picture/))
                {
                    await Builders.ChangeCountryWelcomePhoto(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/notifications_off/))
                {
                    context.country.notifications = false
                    await Country.update({notifications: false}, {where: {id: context.country.id}})
                    current_keyboard[0][1] = keyboard.notificationsOnButton
                    await context.send("🔇 Уведомления отключены", {keyboard: keyboard.build(current_keyboard)})
                }
                if (context.messagePayload.choice.match(/notifications_on/))
                {
                    context.country.notifications = true
                    await Country.update({notifications: true}, {where: {id: context.country.id}})
                    current_keyboard[0][1] = keyboard.notificationsOffButton
                    await context.send("🔇 Уведомления отключены", {keyboard: keyboard.build(current_keyboard)})
                }
            }
            else
            {
                context.send("👉🏻 Управление городом",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/ChangeCountryMenu", e)
        }
    }

    CountryInfoMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetCountryInfoMenuKeyboard()
            context.country = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.GetCountryForCity(context.player.location).leaderID === context.player.id || context.official)
            {
                context.country = Data.countries[context.player.countryID]
            }
            if(!context.country)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice.match(/back|resources|cities|country_info|players_list/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад", {
                        keyboard: keyboard.build(this.GetGovernanceCountryMenuKeyboard(context))
                    })
                    context.player.state = this.GovernanceCountryMenu
                }
                if (context.messagePayload.choice.match(/resources/))
                {
                    await context.send(context.country.GetResources())
                }
                if (context.messagePayload.choice.match(/cities/))
                {
                    await Builders.GetCountryCities(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/country_info/))
                {
                    await context.send(await context.country.GetAllInfo())
                }
                if (context.messagePayload.choice.match(/players_list/))
                {
                    await Builders.GetCountryPlayersList(context)
                }
            }
            else
            {
                context.send("👉🏻 Управление городом",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/CountryInfoMenu", e)
        }
    }


    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    //Меню градоначальника

    GetCityControlsKeyboard = () =>
    {
        return [
            [keyboard.controlsButton],
            [keyboard.buildingsButton, keyboard.infoButton, keyboard.parametersButton],
            [keyboard.backButton]
        ]
    }

    GetCityControlsBuildingsMenuKeyboard = () =>
    {
        return [
            [keyboard.newBuildingButton, keyboard.deleteBuildingButton],
            [keyboard.upgradeButton, keyboard.expandButton],
            [keyboard.backButton]
        ]
    }

    GetCityInfoMenuKeyboard = () =>
    {
        return [
            [keyboard.resourcesButton, keyboard.playersListButton],
            [keyboard.buildingsButton, keyboard.cityInfoButton],
            [keyboard.backButton]
        ]
    }

    GetChangeCityMenuKeyboard = (context) =>
    {
        let kb = [
            [keyboard.nameButton, keyboard.descriptionButton],
            [keyboard.photoButton],
            [keyboard.backButton]
        ]
        if(Data.cities[context.player.location].notifications) kb[1].push(keyboard.notificationsOffButton)
        else kb[1].push(keyboard.notificationsOnButton)
        return kb
    }

    GetControlsCityMenuKeyboard = () =>
    {
        return [
            [keyboard.getResourcesButton],
            [keyboard.transactionButton, keyboard.buildRoadButton],
            [keyboard.backButton]
        ]
    }

    CityControlsMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetCityControlsKeyboard()
            if(context.messagePayload?.choice.match(/back|buildings|controls|info|params/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                    })
                    context.player.state = this.StartScreen
                }
                if(context.messagePayload.choice.match(/buildings/))
                {
                    context.send("▶ Постройки",{
                        keyboard: keyboard.build(this.GetCityControlsBuildingsMenuKeyboard())
                    })
                    context.player.state = this.CityBuildingsMenu
                }
                if(context.messagePayload.choice.match(/info/))
                {
                    context.send("▶ Информация о городе",{
                        keyboard: keyboard.build(this.GetCityInfoMenuKeyboard())
                    })
                    context.player.state = this.CityInfoMenu
                }
                if(context.messagePayload.choice.match(/params/))
                {
                    context.send("▶ Изменить",{
                        keyboard: keyboard.build(this.GetChangeCityMenuKeyboard(context))
                    })
                    context.player.state = this.ChangeCityMenu
                }
                if(context.messagePayload.choice.match(/controls/))
                {
                    context.send("▶ Управление",{
                        keyboard: keyboard.build(this.GetControlsCityMenuKeyboard())
                    })
                    context.player.state = this.ControlsCityMenu
                }
            }
            else
            {
                context.send("👉🏻 Управление городом",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/CityControlsMenu", e)
        }
    }

    ControlsCityMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetControlsCityMenuKeyboard()
            context.cityID = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.cities[context.player.location].leaderID === context.player.id)
            {
                context.cityID = context.player.location
            }
            if(context.cityID === null)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice.match(/back|get_resource|transaction|build_road/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetCityControlsKeyboard())
                    })
                    context.player.state = this.CityControlsMenu
                }
                if(context.messagePayload.choice.match(/transaction/))
                {
                    if(Data.cities[context.cityID].isSiege)
                    {
                        await context.send(`Вы не можете распоряжаться ресурсами в осаженном городе`)
                        return
                    }
                    await Builders.CityTransaction(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/get_resource/))
                {
                    await Builders.GetAllCityResources(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/build_road/))
                {
                    await Builders.BuildTheRoad(context, current_keyboard)
                }
            }
            else
            {
                await context.send("👉🏻 Управление городом",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/ControlsCityMenu", e)
        }
    }

    ChangeCityMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetChangeCityMenuKeyboard(context)
            context.city = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.cities[context.player.location].leaderID === context.player.id)
            {
                context.city = Data.cities[context.player.location]
            }
            if(!context.city)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice.match(/back|name|description|photo|notifications_off|notifications_on/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetCityControlsKeyboard())
                    })
                    context.player.state = this.CityControlsMenu
                }
                if(context.messagePayload.choice.match(/name/))
                {
                    await Builders.ChangeCityName(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/description/))
                {
                    await Builders.ChangeCityDescription(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/photo/))
                {
                    await Builders.ChangeCityPhoto(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/notifications_off/))
                {
                    context.city.notifications = false
                    await City.update({notifications: false}, {where: {id: context.city.id}})
                    current_keyboard[1][1] = keyboard.notificationsOnButton
                    await context.send("🔇 Уведомления отключены", {keyboard: keyboard.build(current_keyboard)})
                }
                if (context.messagePayload.choice.match(/notifications_on/))
                {
                    context.city.notifications = true
                    await City.update({notifications: true}, {where: {id: context.city.id}})
                    current_keyboard[1][1] = keyboard.notificationsOffButton
                    await context.send("🔇 Уведомления отключены", {keyboard: keyboard.build(current_keyboard)})
                }
            }
            else
            {
                await context.send("👉🏻 Управление городом",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/ChangeCityMenu", e)
        }
    }

    CityBuildingsMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetCityControlsBuildingsMenuKeyboard()
            context.cityID = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.cities[context.player.location].leaderID === context.player.id)
            {
                context.cityID = context.player.location
            }
            if(context.cityID === null)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice.match(/back|new_building|delete_building|upgrade|expand/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetCityControlsKeyboard())
                    })
                    context.player.state = this.CityControlsMenu
                }
                if(context.messagePayload.choice.match(/delete_building/))
                {
                    await Builders.DeleteCityBuilding(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/new_building/))
                {
                    await Builders.CreateCityBuilding(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/upgrade/))
                {
                    await Builders.UpgradeCityBuilding(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/expand/))
                {
                    await Builders.ExpandCity(context, current_keyboard)
                }
            }
            else
            {
                await context.send("👉🏻 Постройки",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/CityBuildingsMenu", e)
        }
    }

    CityInfoMenu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetCityInfoMenuKeyboard()
            context.cityID = null
            if(NameLibrary.RoleEstimator(context.player.role) > 2 || Data.cities[context.player.location].leaderID === context.player.id)
            {
                context.cityID = context.player.location
            }
            if(context.cityID === null)
            {
                context.player.state = this.StartScreen
                await context.send("⚠ Вы не имеете права здесь находиться", {keyboard: keyboard.build(this.GetStartMenuKeyboard(context))})
                return
            }
            if(context.messagePayload?.choice.match(/back|buildings|resources|city_info|players_list/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetCityControlsKeyboard())
                    })
                    context.player.state = this.CityControlsMenu
                }
                if(context.messagePayload.choice.match(/buildings/))
                {
                    let request = ""
                    if(!Data.buildings[context.cityID])
                    {
                        await context.send("⛺ В городе нет построек", {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    for(let i = 0; i < Data.buildings[context.cityID].length; i++)
                    {
                        request += (i+1) + ": " + NameLibrary.GetBuildingType(Data.buildings[context.cityID][i].type) + " \"" + Data.buildings[context.cityID][i].name + "\" " + Data.buildings[context.cityID][i].level + ` ур ${Data.buildings[context.cityID][i].ownerType === "country" ? " (гос)" : ""}\n`
                    }
                    await context.send(`Список построек в городе ${Data.cities[context.cityID].name}:\n\n${request}`)
                }
                if(context.messagePayload.choice.match(/resources/))
                {
                    await context.send(Data.cities[context.cityID].GetResources())
                }
                if(context.messagePayload.choice.match(/city_info/))
                {
                    await context.send(await Data.cities[context.cityID].GetAllInfo())
                }
                if(context.messagePayload.choice.match(/players_list/))
                {
                    await Builders.GetCityPlayersList(context)
                }
            }
            else
            {
                await context.send("👉🏻 Информация",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/CityInfoMenu", e)
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Меню
    GetMenuKeyboard = () =>
    {
        return [[keyboard.extractButton],
            [keyboard.locationButton, keyboard.profileButton],
            [keyboard.ratingsButton, keyboard.parametersButton],
            [keyboard.backButton]]
    }

    GetProfileMenuKeyboard = async (context) =>
    {
        let kb = [
            [],
            [keyboard.aboutMeButton, keyboard.propertyButton, keyboard.effectsButton],
            [keyboard.backButton]
        ]
        context.player.citizenship !== null ? kb[0].push(keyboard.refuseCitizenshipButton) : kb[0].push(keyboard.getCitizenshipButton)
        context.player.marriedID !== null ? kb[0].push(keyboard.refuseMerryButton) : kb[0].push(keyboard.merryButton)
        context.player.lastWill ? kb[0].push(keyboard.deleteLastWillButton) : kb[0].push(keyboard.createLastWillButton)
        if(parseInt(context.player.citizenship) === parseInt(Data.GetCountryForCity(context.player.location).id))
        {
            if(!context.player.registration || context.player.registration === "candidate")
            {
                kb[2][1] = keyboard.getRegistrationButton
            }
            else if(context.player.registration)
            {
                kb[2][1] = keyboard.refuseRegistrationButton
            }
        }
        return kb
    }
    GetLocationMenuKeyboard = () =>
    {
        return [
            [keyboard.whereMeButton, keyboard.chatListButton,keyboard.buildingsButton],
            [keyboard.otherCity, keyboard.mapButton,  keyboard.otherCountry],
            [keyboard.backButton]
        ]
    }

    GetExtractingMenuKeyboard = (context) =>
    {
        const country = Data.GetCountryForCity(context.player.location)
        const kb = [
            [context.player.isRelaxing ? keyboard.wakeupButton : keyboard.relaxButton],
            [],
            [],
            [keyboard.backButton]
        ]
        country.resources.match(/wheat/) && kb[1].push(keyboard.extractWheatButton)
        country.resources.match(/stone/) && kb[1].push(keyboard.extractStoneButton)
        country.resources.match(/wood/) && kb[1].push(keyboard.extractWoodButton)
        country.resources.match(/iron/) && kb[2].push(keyboard.extractIronButton)
        country.resources.match(/copper/) && kb[2].push(keyboard.extractCopperButton)
        country.resources.match(/silver/) && kb[2].push(keyboard.extractSilverButton)

        return kb
    }

    GetRatingsMenuKeyboard = () =>
    {
        return [
            [keyboard.richButton],
            [keyboard.mostActiveButton, keyboard.mostUnculturedButton],
            [keyboard.stickermansButton, keyboard.musicLoversButton],
            [keyboard.backButton]
        ]
    }

    GetParamsMenuKeyboard = (context) =>
    {
        const kb = [
            [keyboard.postboxButton],
            [keyboard.changeNickButton, keyboard.adminsButton, keyboard.infoButton],
            [keyboard.backButton]
        ]
        context.player.notifications ? kb[0].push(keyboard.notificationsOffButton) : kb[0].push(keyboard.notificationsOnButton)
        return kb
    }

    GetPropertyMenuKeyboard = () =>
    {
        return [
            [keyboard.listButton],
            [keyboard.buildButton, keyboard.upgradeButton, keyboard.resourcesButton],
            [keyboard.giveKeyButton, keyboard.transactionButton, keyboard.copyKeyButton],
            [keyboard.backButton]
        ]
    }

    GetInBuildingMenuKeyboard = (context) =>
    {
        switch (context.player.inBuild.type)
        {
            case "building_of_house":
                return [[keyboard.relaxButton], [keyboard.backButton]]
            case "building_of_bank":
                return [[keyboard.backButton]]
            case "building_of_mint":
                return [[keyboard.changeMoneyButton], [keyboard.backButton]]
            case "building_of_barracks":
                return [[keyboard.backButton]]
            case "building_of_port":
                return [[keyboard.backButton]]
            case "building_of_wheat":
                return [[keyboard.getResourcesButton], [keyboard.backButton]]
            case "building_of_stone":
                return [[keyboard.getResourcesButton], [keyboard.backButton]]
            case "building_of_wood":
                return [[keyboard.getResourcesButton], [keyboard.backButton]]
            case "building_of_iron":
                return [[keyboard.getResourcesButton], [keyboard.backButton]]
            case "building_of_copper":
                return [[keyboard.getResourcesButton], [keyboard.backButton]]
            case "building_of_silver":
                return [[keyboard.getResourcesButton], [keyboard.backButton]]
        }
        return [[keyboard.backButton]]
    }

    Menu = async(context) =>
    {
        try
        {
            const current_keyboard = this.GetMenuKeyboard()
            if(context.messagePayload?.choice.match(/back|location|extract|profile|ratings|params/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("↪ Назад",{
                        keyboard: keyboard.build(this.GetStartMenuKeyboard(context))
                    })
                    context.player.state = this.StartScreen
                }
                if(context.messagePayload.choice.match(/params/))
                {
                    await context.send("▶ Параметры",{
                        keyboard: keyboard.build(this.GetParamsMenuKeyboard(context))
                    })
                    context.player.state = this.Params
                }
                if(context.messagePayload.choice.match(/location/))
                {
                    await context.send("▶ Локация",{
                        keyboard: keyboard.build(this.GetLocationMenuKeyboard())
                    })
                    context.player.state = this.Location
                }
                if(context.messagePayload.choice.match(/profile/))
                {
                    await context.send("▶ Профиль", {
                        keyboard: keyboard.build(await this.GetProfileMenuKeyboard(context))
                    })
                    context.player.state = this.Profile
                }
                if(context.messagePayload.choice.match(/extract/))
                {
                    await context.send(`▶ Добыча ресурсов\n\n💪 Ваш уровень бодрости ${context.player.fatigue}%`, {
                        keyboard: keyboard.build(this.GetExtractingMenuKeyboard(context))
                    })
                    context.player.state = this.Extracting
                }
                if(context.messagePayload.choice.match(/ratings/))
                {
                    context.send("▶ Рейтинги",{
                        keyboard: keyboard.build(this.GetRatingsMenuKeyboard())
                    })
                    context.player.state = this.Ratings
                }
            }
            else
            {
                await context.send("👉🏻 Меню",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/Menu", e)
        }
    }

    Property = async(context) =>
    {
        try
        {
            let current_keyboard = this.GetPropertyMenuKeyboard()
            if (context.messagePayload?.choice.match(/back|list|build|give_key|copy_key|upgrade|resources|transaction/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    await context.send("▶ Меню", {
                        keyboard: keyboard.build(this.GetMenuKeyboard())
                    })
                    context.player.state = this.Menu
                }
                if(context.messagePayload.choice.match(/transaction/))
                {
                    if(context.player.CantTransact())
                    {
                        await context.send(`Вы не можете делать переводы, причина:\n\n${context.player.WhyCantTransact()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    await Builders.Transaction(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/list/))
                {
                    await Builders.GetAllProperty(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/give_key/))
                {
                    if(context.player.CantTransact())
                    {
                        await context.send(`Вы не можете обмениваться ключами, причина:\n\n${context.player.WhyCantTransact()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    await Builders.GiveKey(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/copy_key/))
                {
                    await Builders.CopyKey(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/build/))
                {
                    if(context.player.CantTransact())
                    {
                        await context.send(`Вы не можете строить, причина:\n\n${context.player.WhyCantTransact()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    await Builders.NewUserBuilding(context, current_keyboard)
                }
                if (context.messagePayload.choice.match(/upgrade/))
                {
                    if(context.player.CantTransact())
                    {
                        await context.send(`Вы не можете улучшать постройки, причина:\n\n${context.player.WhyCantTransact()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    await Builders.UpgradeUserBuilding(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/resources/))
                {
                    await context.send(context.player.GetResources())
                }
            }
            else
            {
                await context.send("👉🏻 Имущество", {
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/Property", e)
        }
    }

    Params = async(context) =>
    {
        try
        {
            let current_keyboard = this.GetParamsMenuKeyboard(context)
            if (context.messagePayload?.choice.match(/back|notifications_on|notifications_off|info|admins|postbox|change_nick/))
            {
                if (context.messagePayload.choice.match(/back/))
                {
                    await context.send("▶ Меню", {
                        keyboard: keyboard.build(this.GetMenuKeyboard())
                    })
                    context.player.state = this.Menu
                }
                if (context.messagePayload.choice.match(/notifications_on/))
                {
                    context.player.notifications = true
                    await PlayerStatus.update({notifications: true}, {where: {id: context.player.id}})
                    current_keyboard[0][0] = keyboard.notificationsOffButton
                    await context.send("✅ Уведомления включены", {keyboard: keyboard.build(current_keyboard)})
                }
                if (context.messagePayload.choice.match(/notifications_off/))
                {
                    context.player.notifications = false
                    await PlayerStatus.update({notifications: false}, {where: {id: context.player.id}})
                    current_keyboard[0][0] = keyboard.notificationsOnButton
                    await context.send("❌ Уведомления отключены", {keyboard: keyboard.build(current_keyboard)})
                }
                if (context.messagePayload.choice.match(/admins/))
                {
                    let request = "🚾 Админ-состав проекта:\n\n"
                    request += "🔝 Владелец:\n"
                    request += Data.owner ? `*id${Data.owner.id}(${Data.owner.nick})` : "Отсутствует"
                    request += "\n\n"
                    request += "🤴 Глава проекта:\n"
                    request += Data.projectHead ? `- *id${Data.projectHead.id}(${Data.projectHead.nick})` : "Отсутствует"
                    request += "\n\n"
                    request += "🔧 Тех-поддержка:\n"
                    for (const key of Object.keys(Data.supports))
                    {
                        request += `*id${Data.supports[key].id}(${Data.supports[key].nick})\n`
                    }
                    if(Object.keys(Data.supports).length === 0) request += "Отсутствует"
                    request += "\n\n"
                    request += "♿ Администраторы:\n"
                    for (const key of Object.keys(Data.administrators))
                    {
                        request += `*id${Data.administrators[key].id}(${Data.administrators[key].nick})\n`
                    }
                    if(Object.keys(Data.administrators).length === 0) request += "Отсутствует"
                    await context.send(request)
                }
                if(context.messagePayload.choice.match(/postbox/))
                {
                    let request = "📫 Последние 5 сообщений:\n\n"
                    const messages = await Messages.findAll({limit: 5})
                    if(messages.length > 0)
                    {
                        for (let i = 0; i < messages.length; i++)
                        {
                            request += "🔸 Сообщение от " + NameLibrary.ParseDateTime(messages[i].dataValues.createdAt) + ":\nℹ " + messages[i].dataValues.text + "\n\n"
                        }
                    }
                    else
                    {
                        request += "Не добавлено"
                    }
                    await context.send(request)
                }
                if (context.messagePayload.choice.match(/info/))
                {
                    let request = "Проект *public218388422 («ZEUS - Вселенная игроков»).\n Войны, интриги, симулятор античного жителя.\n\nБот создан на NodeJS версии: "+ process.version + "\nБот версии: "+ Data.variables.version +"\nВладелец проекта - *id212554134(Игорь Будзинский)\nГлавный разработчик - *id565472458(Александр Ковалысько)\nЕсли возникли проблемы с использованием, кого пинать - знаете."
                    await context.send(request)
                }
                if (context.messagePayload.choice.match(/change_nick/))
                {
                    await Builders.ChangeNick(context, current_keyboard)
                }
            }
            else
            {
                await context.send("👉🏻 Параметры",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/Params", e)
        }
    }

    Ratings = async(context) =>
    {
        try
        {
            let current_keyboard = this.GetRatingsMenuKeyboard()

            if (context.messagePayload?.choice.match(/back|most_active|uncultured|stickermans|music_lovers|rich/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("▶ Меню",{
                        keyboard: keyboard.build(this.GetMenuKeyboard())
                    })
                    context.player.state = this.Menu
                }
                if(context.messagePayload.choice.match(/most_active/))
                {
                    let array = []
                    Object.keys(Data.activity).forEach(key => {
                        array.push([Data.activity[key], key])
                    })
                    if(array.length === 0)
                    {
                        await context.send("😴 За сегодня никто ничего не успел написать в чат")
                        return
                    }
                    array = array.sort()
                    let request = "🎆 Самые активные за сегодня:\n"
                    for(let i = 0; i < Math.min(10, array.length); i++)
                    {
                        request += (i + 1) + ": " + await NameLibrary.GetPlayerNick(array[i][1]) + " - " + array[i][0] + " сообщений\n"
                    }
                    await context.send(request)
                }
                if(context.messagePayload.choice.match(/uncultured/))
                {
                    let array = []
                    Object.keys(Data.uncultured).forEach(key => {
                        array.push([Data.uncultured[key], key])
                    })
                    if(array.length === 0)
                    {
                        await context.send("😸 У нас сегодня никто не матерился!")
                        return
                    }
                    array = array.sort()
                    let request = "🤬 Сегодня больше всех матерились:\n"
                    for(let i = 0; i < Math.min(10, array.length); i++)
                    {
                        request += (i + 1) + ": " + await NameLibrary.GetPlayerNick(array[i][1]) + " - " + array[i][0] + " раз\n"
                    }
                    await context.send(request)
                }
                if(context.messagePayload.choice.match(/stickermans/))
                {
                    let array = []
                    Object.keys(Data.stickermans).forEach(key => {
                        array.push([Data.stickermans[key], key])
                    })
                    if(array.length === 0)
                    {
                        await context.send("👽 Сегодня у нас никто не отправлял стикеры")
                        return
                    }
                    array = array.sort()
                    let request = "💩 Отправили больше всех стикеров на сегодня:\n"
                    for(let i = 0; i < Math.min(10, array.length); i++)
                    {
                        request += (i + 1) + ": " + await NameLibrary.GetPlayerNick(array[i][1]) + " - " + array[i][0] + " раз\n"
                    }
                    await context.send(request)
                }
                if(context.messagePayload.choice.match(/music_lovers/))
                {
                    let array = []
                    Object.keys(Data.musicLovers).forEach(key => {
                        array.push([Data.musicLovers[key], key])
                    })
                    if(array.length === 0)
                    {
                        await context.send("🔇 Сегодня никто не делился музыкой")
                        return
                    }
                    array = array.sort()
                    let request = "🎵 Больше всех сегодня делились музыкой:\n"
                    for(let i = 0; i < Math.min(10, array.length); i++)
                    {
                        request += (i + 1) + ": " + await NameLibrary.GetPlayerNick(array[i][1]) + " - " + array[i][0] + " раз\n"
                    }
                    await context.send(request)
                }
                if(context.messagePayload.choice.match(/rich/))
                {
                    await Builders.GetMostRich(context)
                }
            }
            else
            {
                await context.send("👉🏻 Рейтинги",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/Ratings", e)
        }
    }

    RelaxingInTheHouse = async(context) =>
    {
        try
        {
            if (context.messagePayload?.choice.match(/wakeup/))
            {
                let need
                const now = new Date()
                switch (context.player.inBuild.level)
                {
                    case 1:
                        need = 330
                        break
                    case 2:
                        need = 300
                        break
                    case 3:
                        need = 270
                        break
                    case 4:
                        need = 240
                        break
                }
                if(context.player.timeout)
                {
                    clearTimeout(context.player.timeout)
                }
                const time = Math.max(0, Math.round((context.player.lastActionTime - now) / 60000))
                context.player.isFreezed = false
                context.player.inBuild = null
                context.player.fatigue = Math.round(100 - (time * (100 / need)))
                await context.send(`💪 Ваш уровень энергии восстановлен до ${context.player.fatigue}%`,
                    {
                        keyboard: keyboard.build(this.GetMenuKeyboard())
                    })
                context.player.state = this.Menu
            }
            else
            {
                await context.send(`💤 До полного восстановления сил осталось ${NameLibrary.ParseFutureTime(context.player.lastActionTime)}`)
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/RelaxingInTheHouse", e)
        }
    }

    Profile = async(context) =>
    {
        try
        {
            let current_keyboard = await this.GetProfileMenuKeyboard(context)

            if (context.messagePayload?.choice.match(/back|get_registration|refuse_registration|get_citizenship|refuse_citizenship|merry|divorce|create_last_will|delete_last_will|about_me|effects|property/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("▶ Меню",{
                        keyboard: keyboard.build(this.GetMenuKeyboard())
                    })
                    context.player.state = this.Menu
                }
                if(context.messagePayload.choice.match(/about_me/))
                {
                    await context.send(`Информация о вас:\n${context.player.GetInfo()}`)
                }
                if(context.messagePayload.choice.match(/effects/))
                {
                    let request = `*id${context.player.id}(Ваши) эффекты:\n\n`
                    let count = 0
                    for(let i = 0; i < context.player.effects.length; i++)
                    {
                        if(context.player.effects[i])
                        {
                            request += "🔸 " + context.player.effects[i].GetInfo() + "\n"
                            count++
                        }
                    }
                    if(count === 0)
                    {
                        request += "У вас нет эффектов."
                    }
                    await context.send(request)
                }
                if(context.messagePayload.choice.match(/create_last_will/))
                {
                    await Builders.CreateLastWill(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/delete_last_will/))
                {
                    await Builders.DeleteLastWill(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/merry/))
                {
                    await Builders.OfferMarry(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/divorce/))
                {
                    await Builders.Divorce(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/get_citizenship/))
                {
                    await Builders.GetCitizenship(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/refuse_citizenship/))
                {
                    await Builders.RefuseCitizenship(context, current_keyboard, {keyboard: this.GetProfileMenuKeyboard})
                }
                if(context.messagePayload.choice.match(/get_registration/))
                {
                    await Builders.GetRegistration(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/refuse_registration/))
                {
                    await Builders.RefuseRegistration(context, current_keyboard, {keyboard: this.GetProfileMenuKeyboard})
                }
                if(context.messagePayload.choice.match(/property/))
                {
                    context.send("▶ Имущество",{
                        keyboard: keyboard.build(this.GetPropertyMenuKeyboard())
                    })
                    context.player.state = this.Property
                }
            }
            else
            {
                await context.send("👉🏻 Профиль",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/Profile", e)
        }
    }

    Location = async(context) =>
    {
        try
        {
            let current_keyboard = this.GetLocationMenuKeyboard()
            if (context.messagePayload?.choice.match(/back|map|where_me|buildings|other_city|other_country|chat_list/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("▶ Меню",{
                        keyboard: keyboard.build(this.GetMenuKeyboard())
                    })
                    context.player.state = this.Menu
                }
                if(context.messagePayload.choice.match(/map/))
                {
                    console.log(Data.variables)
                    await context.send("Карта", {attachment: Data.variables.globalMap})
                }
                if(context.messagePayload.choice.match(/where_me/))
                {
                    await context.send(`Ваше местоположение: ${Data.GetCityInfo(context.player.location)}`)
                }
                if(context.messagePayload.choice.match(/buildings/))
                {
                    await Builders.EnterBuilding(context, current_keyboard, {build: this.InBuilding, buildKeyboard: this.GetInBuildingMenuKeyboard})
                }
                if(context.messagePayload.choice.match(/other_city/))
                {
                    if(context.player.CantMove())
                    {
                        await context.send(`Вы не можете покинуть город, причина:\n\n${context.player.WhyCantMove()}`)
                        return
                    }
                    await Builders.GoToOtherCity(context, current_keyboard, {moving: this.WaitingWalkMenu, finish: this.StartScreen, finishKeyboard: this.GetStartMenuKeyboard})
                 }
                if(context.messagePayload.choice.match(/other_country/))
                {
                    if(context.player.CantMove())
                    {
                        await context.send(`Вы не можете покинуть фракцию, причина:\n\n${context.player.WhyCantMove()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    await Builders.GoToOtherCountry(context, current_keyboard, {moving: this.WaitingWalkMenu, finish: this.StartScreen, finishKeyboard: this.GetStartMenuKeyboard})
                }
                if(context.messagePayload.choice.match(/chat_list/))
                {
                    let request = "💬 Список чатов:\n"
                    const chats = await Chats.findAll()
                    let flag = true
                    for (let i = 0; i < Data.countries.length; i++)
                    {
                        flag = true
                        if(Data.countries[i])
                        {
                            request += "\n🔶 Фракция " + Data.GetCountryName(Data.countries[i].id) + ":"
                            for(const chat of chats)
                            {
                                if(Data.countries[i].id === chat.dataValues.countryID)
                                {
                                    request += "\n🔸 " + chat.dataValues.name + " - " + "https://vk.cc/" + chat.dataValues.link + "\n"
                                    flag = false
                                }
                            }
                            if(flag)
                            {
                                request += "  -  Не добавлено\n"
                            }
                        }
                    }
                    await context.send(request)
                }
            }
            else
            {
                context.send("👉🏻 Местоположение",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/Location", e)
        }
    }

    InBuilding = async(context) => {
        try
        {
            let current_keyboard = await this.GetInBuildingMenuKeyboard(context)
            if (context.messagePayload?.choice.match(/back|get_resource|relax|change_money/) && context.player.inBuild)
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    await context.send("▶ Местоположение",{
                        keyboard: keyboard.build(this.GetLocationMenuKeyboard())
                    })
                    context.player.state = this.Location
                }
                if(context.messagePayload.choice.match(/get_resource/) && context.player.inBuild?.type.match(/wheat|stone|wood|iron|copper|silver/))
                {
                    await Builders.GetResourcesFormBuilding(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/change_money/))
                {
                    await Builders.GetChangeSilverInMintBuilding(context, current_keyboard)
                }
                if(context.messagePayload.choice.match(/relax/) && context.player.inBuild?.type.match(/house/))
                {
                    await Builders.RelaxInTheHouse(context, current_keyboard, {
                        Menu: this.Menu,
                        Relaxing: this.RelaxingInTheHouse
                    })
                }
            }
            else if (!context.player.inBuild)
            {
                context.player.state = this.Location
                context.send("Как вы оказались в здании?", {keyboard: keyboard.build(this.GetLocationMenuKeyboard())})
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/InBuilding", e)
        }
    }

    Extracting = async(context) => {
        try
        {
            let current_keyboard = this.GetExtractingMenuKeyboard(context)
            if (context.messagePayload?.choice.match(/back|extract_wheat|extract_stone|extract_wood|extract_iron|extract_copper|extract_silver|relax|wakeup/))
            {
                if(context.messagePayload.choice.match(/back/))
                {
                    context.send("▶ Меню",{
                        keyboard: keyboard.build(this.GetMenuKeyboard())
                    })
                    context.player.state = this.Menu
                }
                if(context.messagePayload.choice.match(/extract_wheat/))
                {
                    if(context.player.CantExtraction())
                    {
                        await context.send(`Вы не можете добывать ресурсы, причина:\n\n${context.player.WhyCantExtraction()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(2.5 * fatigue, 7.5 * fatigue)
                        context.player.fatigue = context.player.HasEffect("industriousness") ? Math.max(0, context.player.fatigue - 50) : 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1 * (context.player.HasEffect("luck") ? 2 : 1)))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await Data.AddPlayerResources(context.player.id, {wheat: extraction, diamonds: diamonds})
                        context.send(`🌾 Вы добыли ${extraction} зерна`, {attachment: "photo565472458_457240622_c245972e88cb05d4ec"})
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_stone/))
                {
                    if(context.player.CantExtraction())
                    {
                        await context.send(`Вы не можете добывать ресурсы, причина:\n\n${context.player.WhyCantExtraction()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(2.5 * fatigue, 5 * fatigue)
                        context.player.fatigue = context.player.HasEffect("industriousness") ? Math.max(0, context.player.fatigue - 50) : 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1 * (context.player.HasEffect("luck") ? 2 : 1)))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await Data.AddPlayerResources(context.player.id, {stone: extraction, diamonds: diamonds})
                        context.send(`🪨 Вы добыли ${extraction} камня`, {attachment: "photo565472458_457240628_68cde51b5783682f79"})
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_wood/))
                {
                    if(context.player.CantExtraction())
                    {
                        await context.send(`Вы не можете добывать ресурсы, причина:\n\n${context.player.WhyCantExtraction()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(2.5 * fatigue, 5 * fatigue)
                        context.player.fatigue = context.player.HasEffect("industriousness") ? Math.max(0, context.player.fatigue - 50) : 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1 * (context.player.HasEffect("luck") ? 2 : 1)))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await Data.AddPlayerResources(context.player.id, {wood: extraction, diamonds: diamonds})
                        context.send(`🪵 Вы добыли ${extraction} дерева`, {attachment: "photo565472458_457240621_da59ab56e0b4759369"})
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_iron/))
                {
                    if(context.player.CantExtraction())
                    {
                        await context.send(`Вы не можете добывать ресурсы, причина:\n\n${context.player.WhyCantExtraction()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(0.65 * fatigue, 1.85 * fatigue)
                        context.player.fatigue = context.player.HasEffect("industriousness") ? Math.max(0, context.player.fatigue - 50) : 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1 * (context.player.HasEffect("luck") ? 2 : 1)))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await Data.AddPlayerResources(context.player.id, {iron: extraction, diamonds: diamonds})
                        context.send(`🌑 Вы добыли ${extraction} железа`, {attachment: "photo565472458_457240629_1c30668d6937ddbc82"})
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_copper/))
                {
                    if(context.player.CantExtraction())
                    {
                        await context.send(`Вы не можете добывать ресурсы, причина:\n\n${context.player.WhyCantExtraction()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(0.65 * fatigue, 1.85 * fatigue)
                        context.player.fatigue = context.player.HasEffect("industriousness") ? Math.max(0, context.player.fatigue - 50) : 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1 * (context.player.HasEffect("luck") ? 2 : 1)))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await Data.AddPlayerResources(context.player.id, {copper: extraction, diamonds: diamonds})
                        context.send(`🪙 Вы добыли ${extraction} бронзы`, {attachment: "photo565472458_457240627_0163551e74f37a1633"})
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/extract_silver/))
                {
                    if(context.player.CantExtraction())
                    {
                        await context.send(`Вы не можете добывать ресурсы, причина:\n\n${context.player.WhyCantExtraction()}`, {keyboard: keyboard.build(current_keyboard)})
                        return
                    }
                    const fatigue = context.player.fatigue
                    if(fatigue > 0)
                    {
                        const extraction = NameLibrary.GetRandomNumb(1.25 * fatigue, 2.5 * fatigue)
                        context.player.fatigue = context.player.HasEffect("industriousness") ? Math.max(0, context.player.fatigue - 50) : 0
                        let diamonds = 0
                        if(NameLibrary.GetChance(0.1 * (context.player.HasEffect("luck") ? 2 : 1)))
                        {
                            diamonds = 1
                            context.send(`💎 Вот это удача! Во время добычи вы нашли один алмаз! \nКто-то его потерял или он лежал тут изначально - не важно, теперь он ваш!`)
                        }
                        await Data.AddPlayerResources(context.player.id, {silver: extraction, diamonds: diamonds})
                        context.send(`🥈 Вы добыли ${extraction} серебра`, {attachment: "photo565472458_457240630_020e0b0f3eaee322a7"})
                    }
                    else
                    {
                        context.send("🥴 Вам не хватает сил для добычи ресурсов, пора отдохнуть.")
                    }
                }
                if(context.messagePayload.choice.match(/relax/))
                {
                    if(context.player.fatigue < 100)
                    {
                        current_keyboard[0][0] = keyboard.wakeupButton
                        await Builders.Relax(context, current_keyboard)
                    }
                    else
                    {
                        await context.send("💪 Вы полны сил.")
                    }
                }
                if(context.messagePayload.choice.match(/wakeup/))
                {
                    current_keyboard[0][0] = keyboard.relaxButton
                    await Builders.Wakeup(context, current_keyboard)
                }
            }
            else
            {
                await context.send("👉🏻 Добыча ресурсов",{
                    keyboard: keyboard.build(current_keyboard)
                })
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/Extracting", e)
        }
    }

    FillingOutTheForm = async (context) =>
    {
        try
        {
            let start_menu_keyboard = this.GetStartMenuKeyboard(context)
            if(context.messagePayload)
            {
                if(context.messagePayload.choice.type === "build_the_road")
                {
                    let form = await Builders.FillingOutTheRoad(context, start_menu_keyboard, context.messagePayload.choice, {startMenu: this.StartScreen})
                    if(form) return
                }
                if(context.messagePayload.choice.type === "new_warning")
                {
                    let form = await Builders.CreateWarning(context, start_menu_keyboard, context.messagePayload.choice, {startMenu: this.StartScreen})
                    if(form) return
                }
                if(context.messagePayload.choice.type === "new_report")
                {
                    let form = await Builders.NewReport(context, start_menu_keyboard, context.messagePayload.choice, {startMenu: this.StartScreen})
                    if(form) return
                }
                if(context.messagePayload.choice.type === "new_ban")
                {
                    let form = await Builders.Ban(context, start_menu_keyboard, context.messagePayload.choice, {startMenu: this.StartScreen})
                    if(form) return
                }
                await context.send("Возврат в главное меню", {keyboard: keyboard.build(start_menu_keyboard)})
                context.player.state = this.StartScreen
            }
            else
            {
                await context.send("Вы находитесь в режиме заполнения форм, вводите только то, что требует бот.\nЕсли вы оказались здесь по ошибке и не можете выйти из этого режима, то напишите тех-поддержке.")
            }
        }
        catch (e)
        {
            await ErrorHandler.SendLogs(context, "SceneController/FillingOutTheForm", e)
        }
    }
}

module.exports = new SceneController()