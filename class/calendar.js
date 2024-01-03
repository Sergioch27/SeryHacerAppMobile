class calendar {
    constructor(){
        this.DayAndMounth = [];
    }
    CreateCalendar(){
for (let Y = 2024; Y <=2025; Y++){
    const year = [];
    let Years = {
        [`${Y}`]: year,
    }
    this.DayAndMounth.push(Years);
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const MounthLetter = {};
    months.forEach((M)=>{MounthLetter[M] = []})
    for(let m=0; m < 12;m++){
        let month = [];
        let MounthName = months[m];
        let Mounths = {
            [`${MounthName}`]:month,
        }
        year.push(Mounths);
        const FirtsDay = new Date(Y,m,1).getDate();
        const LastDay = new Date(Y,m + 1, 0).getDate();
        const FDay = new Date(Y,m,1).getDay();
        const daysOfWeek = ['Domingo','Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        for (let d=FirtsDay; d <= LastDay; d++){
            let daysOfWeekIndex = (FDay + d - 1) % 7;
            // no se toman encuenta los domingos.
            if(daysOfWeekIndex != 0){
                let DayName = daysOfWeek[daysOfWeekIndex];
                let Day = {
                    day_id:d,
                    dayName: `${DayName}`,
                    hours: this.generateHoursArray(),
                }
                month.push(Day);
            };
        }
    }
}
    return this.DayAndMounth;
    }
    generateHoursArray() {
        const hoursArray = [];
        for (let hour = 8; hour <= 22; hour++) {
            hoursArray.push({
                hour,
                events: [],
            });
        }
        return hoursArray;
    }
}

export default calendar;
