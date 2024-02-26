export default (state, action) => {
    console.log(action)
    switch (action.type) {
        case "openCloseSideBar":
            return {...state, isSideBarOpen: action.payload};
        default:
            return {...state, isSideBarOpen: false};
    }
}