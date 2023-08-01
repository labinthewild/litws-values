//TODO: needs better modularization!
//Moved to a separate file because I had two pages that needed these functions

let registerAnswer = function(form_answers, qn) {
    let q_answer = getQuestionAnswered(`${qn}_option`);
    if(q_answer) {
        form_answers[qn] = q_answer;
    } else {
        delete form_answers[qn];
    }
    return form_answers;
}

let isFormComplete = function(form_answers, quest_size) {
    if(Object.keys(form_answers).length == quest_size){
        $('#btn-next-page').attr('style', 'display:block;');
        $('#btn-next-page')[0].scrollIntoView();
        return true;
    } else {
        $('#btn-next-page').hide();
        return false;
    }
}

let getQuestionAnswered = function(q_name) {
    let input_fields = $(`input[name="${q_name}"]`);
    if (input_fields.length>0) {
        switch (input_fields[0].type){
            case 'radio':
                return $(`input[name="${q_name}"]:checked`).val();
                break;
            case 'checkbox':
                let checked_values = [];
                $.each($(`input[name="${q_name}"]:checked`), function(){
                    checked_values.push($(this).val());
                });
                return checked_values.length>0 ? checked_values : null;
                break;
            default:
                throw TypeError('Field type not supported.');
        }
    } else {
        return null;
    }
}