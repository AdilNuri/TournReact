
var MatchStatus = {
    EMPTY: 1,
    FINISHED: 2,
    LIVE: 3,
    READY: 4,
    HALF: 5,
    SEED_ONLY:6
};
var TeamStatus = {
    disqual: 1,
    WON: 2,
    LOST: 3,
    NO_RESULT: 4
}

class Tourn {
    static CreateTourn(options) {
        if (options == undefined)
            return null;
    
        if (options.empty)
        {
            if (options.count<2)
                return null;
        }
        else if(options.teams==undefined)
            return null;
        return new Tourn(options);
    }
    constructor(options) {
        this.teams = options.teams;
        this.games_for_win = options.games_for_win;
        let empty = options.empty;
        let count = empty ? options.count : this.teams.length;
        this.game_name = options.game;
        this.org = options.org;
        this.players_l =count;
        this.name = options.name;
        this.info =" By "+ this.org+" "+this.players_l+" teams "+"Game: " +this.game_name;
        this.rounds = Math.ceil(Math.log2(count));
        this.max_teams = Math.pow(2, this.rounds);
        this.free_pass = this.max_teams - count;
        this.matches = [];
        this.pairs_array = [];
        let match_seq_number = 1;
        for (let i = 0; i < this.rounds; i++) {
            this.matches[i] = [];
            let power = this.rounds - i - 1;
            let length = Math.pow(2, power);
            for (let k = 0; k < length; k++) {
                this.matches[i][k] = new Match(match_seq_number);
                match_seq_number++;
            }
        }
        this.PairTeams(1, this.rounds);
        for (let i = 0; i < this.pairs_array.length; i++) {
            let id = this.pairs_array[i];
            let team = empty ? null : new Team(id, TeamStatus.NO_RESULT, this.teams[id].name);
            if (id < this.free_pass) {
                let next_match_id = Math.floor(i / 2);
                this.matches[0][i] = null;

                if (i % 2 == 1) {
                    if (empty)
                        this.matches[1][next_match_id].FillSeed(false, id);
                    else {

                        this.matches[1][next_match_id].s_team = team;
                    }
                }
                else {
                    if (empty)
                        this.matches[1][next_match_id].FillSeed(true,id);
                    else {
                        this.matches[1][next_match_id].f_team = team;
                    }
                }
            }
            else {

                let s_id = this.max_teams - id - 1; // -1 array starts from zero;
                let s_team = empty ? null : new Team(s_id, TeamStatus.NO_RESULT, this.teams[s_id].name);
                if (empty) {
                    this.matches[0][i].FillSeed(false, s_id);
                    this.matches[0][i].FillSeed(true,id);
                }
                else {
                    this.matches[0][i].f_team = team;
                    this.matches[0][i].s_team = s_team;
                }
            }
        }
        this.onUpdate = function () { };
     
      
        this.Render("render");
        
    }
    Update()
    {
        this.onUpdate(this.matches);
    }
    PairTeams(init, amount) {

        this.pairs_array.push(init - 1);
        let half_amount = this.max_teams / 2;
        let power = 1;
        while (power < amount) {

            this.PairTeams(half_amount - (init - 1), power);
            power++;
            half_amount /= 2;
        }


        return;
    }
    TeamWonGame(col_index,match_index,isFirst)
    {
        let match =this.matches[col_index][match_index];
        if (match.status!=MatchStatus.LIVE)
            return;
        let team = match.getTeam(isFirst);
        let s_team =match.getTeam(!isFirst);
        team.score++;
        if (team.score==this.games_for_win)
        {
            match.status = MatchStatus.FINISHED;
            match.EndDate = new Date();
            team.status=TeamStatus.WON;
            s_team.status = TeamStatus.LOST;
            if (col_index<this.rounds-1)
            {
                let new_team = new Team(team.id,TeamStatus.NO_RESULT,team.name);
                let next_match_id = Math.floor(match_index/ 2);       
                if (match_index % 2 == 1) 
                {
                
                        this.matches[col_index+1][next_match_id].s_team =new_team;
                
                }
                else 
                {
                
                        this.matches[col_index+1][next_match_id].f_team = new_team;
                
                }
                /*document.getElementById("render").innerHTML="";
                this.Render("render");*/
            }
            else
            {
                alert("Team "+team.name+" WON")
            }
            this.Update();
        }
        else
        {
            this.Update();
        }
    }
    StartMatch(col_index,match_index)
    {
        let match = this.matches[col_index][match_index];
        match.status = MatchStatus.LIVE;   
        match.StartDate = new Date();
        this.Update();
    }
    Render(id) {
        // override this method if you want different way to render e.g: svg,canvas
       
        ReactDOM.render(React.createElement(RenderBracket, { el: this, matches: this.matches ,name:this.name,info:this.info}), document.getElementById(id));

    }
    AddTeam(match,isFirst,name)
    {   
        match.CreatTeamForSeed(isFirst,name);
        this.Update();
    }

}
class RenderBracket extends React.Component {
    constructor(props) {
        super(props);
        props.el.onUpdate = this.Update.bind(this); 
        this.state = {matches:props.matches};       
       

    }
    RenderColumns(){
        let l_margin  = 20;
        let el_height = 40;
        let height_plus_margin = el_height+l_margin;
        let col_height = (this.state.matches[0].length-1)*height_plus_margin+el_height;     

        let columns = this.state.matches.map((c_value, c_index) => {
            let col_style ={height:col_height+"px"};
            col_height-=(el_height+(l_margin/2)-(el_height/2))*2;
            let match_margin = l_margin;
            l_margin  =el_height+(2*l_margin)
            
            
            const col_matches = c_value.map((match, index) => {
                
                let style  ={marginTop:index==0?0:match_margin+"px"};
                return React.createElement
                (
                    RenderMatch,
                    {match:match,index:index,c_index:c_index,style:style,key:index,el:this.props.el},
                    null
                )
                
                })
            return React.createElement
            (
                "div",
                { className: "column" ,style:col_style,key:c_index},
                col_matches
            );
        })
        return columns;
    }
    Update(matches) {
        this.setState({matches:matches});
    }
    render() 
    {
        return React.createElement
        (
            "div",
            { className: "overflow" },
            React.createElement
            (
                "div",
                { className: "contain" },
                this.RenderColumns()
            ),
            React.createElement
            (
                "div",
                {className:"title"},
                this.props.name,
                React.createElement
                (
                    "span",
                    null,
                    this.props.info
                )
            )
        );
    }
}
class RenderMatch extends React.Component
{
    CreateTeam(match,className,isFirst)
    {   
        let btn_class =(isFirst?"first":"second");
        let name = match.getTeamName(isFirst);
        let seed = match.getSeed(isFirst);
        let score = match.getTeamScore(isFirst)
        let c_index = this.props.c_index;
        let index = this.props.index;
        let el = this.props.el; 
        let btn_add_onclick = ()=>
        {
        let text = prompt("Enter team name");
        if (text==null)
            return;
        el.AddTeam(match,isFirst,text)
        };
        let btn_won = React.createElement              
        (
            "div",
            { className: "btn " + btn_class, onClick:()=>{el.TeamWonGame(c_index,index,isFirst)}},
            React.createElement(
                "span",
                null,
                "WON"
            )
        )
        let btn_add = React.createElement
        (
            "div",
            { className: "btn " + btn_class,onClick:btn_add_onclick},
            React.createElement(
                "span",
                null,
                "Add Team"
            )
        )
        let btn = null;
        if (match.status == MatchStatus.SEED_ONLY)
        {
            if (match.NeedTeam(isFirst))
                 btn = btn_add;
        }
        if(match.status == MatchStatus.LIVE)
        {
            btn = btn_won;
        }
        return  React.createElement(
            "div",
            { className: "team"+className},
                React.createElement(
                    "div",
                    { className: "seed" },
                    React.createElement(
                        "span",
                        null,
                        seed
                    )
                ),
                React.createElement(
                    "span",
                    null,
                    name
                ),
                React.createElement(
                    "div",
                    { className: "score" },
                    React.createElement(
                        "span",
                        null,
                        score
                    )
                ),
                btn
            
        )
    }
    render()
    {
        let match = this.props.match;
        let style = this.props.style;
        let index = this.props.index;
        let c_index = this.props.c_index;
        let el = this.props.el;

        let f_class = "";
        let s_class ="";
        let live = "";
        let ready ="";
        if (match!=null)
        {
            if (match.status == MatchStatus.FINISHED)
            {
                if (match.getTeam(true).status == TeamStatus.WON)
                {
                    f_class =" won";
                    s_class =" lost";
                }
                else 
                {
                    f_class =" lost";
                    s_class =" won";
                }
            }
            if (match.status == MatchStatus.LIVE)
                live =" live";
            if (match.status == MatchStatus.READY)
                ready =" ready";
            return React.createElement
            (
                "div",
                { className: "match"+live+ready, style: style},
                this.CreateTeam(match,f_class,true),
                this.CreateTeam(match,s_class,false),                
                React.createElement(
                    "div",
                    { className:"icon"},
                    "LIVE"

                ),
                React.createElement(
                    "div",
                    { className:"start", title:"Start match" ,onClick:()=>{el.StartMatch(c_index,index)}},
                    null

                )
            );
        }
        else 
            return React.createElement("div", { className: "match match_none",style:style });
    }
}
class Team {
    constructor(id, status, name) {
        this.id = id;
        this.name = name;
        this.score = 0;
        this.status = status;
    }

}
class Match {
    constructor(index) {
        this.status = MatchStatus.EMPTY;
        this._f_team = null;
        this._s_team = null;
        this.index = index;
        this._f_seed = 0;
        this._s_seed = 0;
        this.StartDate = null;
        this.EndDate =null;
    }
    FillSeed(isFirst,id) {
        if (isFirst)
            this._f_seed = id+ 1;
        else
            this._s_seed = id + 1;
        this.status  = MatchStatus.SEED_ONLY;
    }
    set f_team(val) {
        if (val == null)
            return;
        if (this._s_team != null)
            this.status = MatchStatus.READY;
        else
        {
            if (!this.status == MatchStatus.SEED_ONLY)
                this.status = MatchStatus.HALF;
        }
        this._f_seed = val.id + 1;
        this._f_team = val;
    }
    set s_team(val) {
        if (val == null)
            return;
        if (this._f_team != null)
            this.status = MatchStatus.READY;
        else
        {
            if (!this.status == MatchStatus.SEED_ONLY)
                this.status = MatchStatus.HALF;
        }
        this._s_seed = val.id + 1;
        this._s_team = val;
    }

    getSeed(isFirst)
    {
        if (isFirst)
            return this._f_seed==0?"":this._f_seed;
        return this._s_seed==0?"":this._s_seed;
    }
    getTeamName(isFirst)
    {
        if(isFirst)
            return this._f_team==null?"":this._f_team.name;
        return this._s_team==null?"":this._s_team.name;
    }
    getTeam(isFirst)
    {
        if(isFirst)
            return this._f_team;
        return this._s_team;
    }
    getTeamScore(isFirst)
    {
        if (isFirst)
            return this._f_team==null?"":this._f_team.score;
        return this._s_team==null?"":this._s_team.score;
    }
    NeedTeam(isFirst)
    {
        if(isFirst)
        {
            if (this._f_team!=null)
                return false;
            return this._f_seed!=0;
            
        }
        if (this._s_team!=null)
            return false;
        return this._s_seed!=0;
    }
    CreatTeamForSeed(isFirst,name)
    {
        if (isFirst)
        {
            this._f_team = new Team(this._f_seed-1,TeamStatus.NO_RESULT,name);
            if (this._s_team != null)
            this.status = MatchStatus.READY;
            
        }
        else
        {
            this._s_team = new Team(this._s_seed-1,TeamStatus.NO_RESULT,name);
            if (this._f_team != null)
            this.status = MatchStatus.READY;
        }
    }
}
