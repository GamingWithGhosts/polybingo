//Author : C19H3R aka CH3CKM473#7035(Discord)

//Note : the arr in parameter is just for sample
//ALSO : the ticket matrix returend is of type object having properties as 
//          Row1,Row2,Row3 each being an array of size 9
//throws error when ever the arr is not of size 15
export const GetTicketMatrixFromArray = (arr = [1, 32, 63, 74, 85, 16, 27, 58, 79, 86, 19, 29, 39, 49, 90]) => {
    if (arr.length !== 15) {
        throw "ERROR : invalid Ticket Array Length";
    }
    const ticketMatrix = {
        row1: Array(9).fill(0),
        row2: Array(9).fill(0),
        row3: Array(9).fill(0),
    }

    //firstRow
    const topRowElements = arr.slice(0, 5)
    let itr=0
    ticketMatrix.row1.forEach((data, idx) => {
        const currLowerRange = idx * 10 + 1;
        const currUpperRange = idx * 10 + 10;
        const currNum=topRowElements[itr]
        if (currNum >= currLowerRange && currNum <= currUpperRange&&itr<5) {
            ticketMatrix.row1[idx]=currNum
            itr++;
        }
    })

    //secondRow
    const MiddleRowElements = arr.slice(5, 10)
     itr=0
    ticketMatrix.row2.forEach((data, idx) => {
        const currLowerRange = idx * 10 + 1;
        const currUpperRange = idx * 10 + 10;
        const currNum=MiddleRowElements[itr]
        if (currNum >= currLowerRange && currNum <= currUpperRange&&itr<5) {
            ticketMatrix.row2[idx]=currNum
            itr++;
        }
    })

    //thirdRow
    const LastRowElements = arr.slice(10, 15)
    itr = 0;
    ticketMatrix.row3.forEach((data, idx) => {
        const currLowerRange = idx * 10 + 1;
        const currUpperRange = idx * 10 + 10;
        const currNum=LastRowElements[itr]
        if (currNum >= currLowerRange && currNum <= currUpperRange&&itr<5) {
            ticketMatrix.row3[idx]=currNum
            itr++;
        }
    })
    
    
    return ticketMatrix;
}